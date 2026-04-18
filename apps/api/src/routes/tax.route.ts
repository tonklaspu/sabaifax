import { Elysia, t } from 'elysia'
import { calculateThai } from '../../../mobile/src/utils/tax'
import { db } from '../db/client'
import { taxProfiles, transactions, categories } from '../db/schema'
import { eq, and, gte, lte, sum, count, sql } from 'drizzle-orm'

export const taxRoute = new Elysia({ prefix: '/tax' })

  // GET /tax/profile
  .get('/profile', async ({ userId }) => {
    const [profile] = await db
      .select()
      .from(taxProfiles)
      .where(eq(taxProfiles.userId, userId))

    return { data: profile ?? null }
  })

  // PUT /tax/profile
  .put('/profile', async ({ userId, body }) => {
    const existing = await db
      .select()
      .from(taxProfiles)
      .where(eq(taxProfiles.userId, userId))

    if (existing.length > 0) {
      const [updated] = await db
        .update(taxProfiles)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(taxProfiles.userId, userId))
        .returning()
      return { data: updated }
    }

    const [created] = await db
      .insert(taxProfiles)
      .values({ ...body, userId })
      .returning()

    return { data: created }
  }, {
    body: t.Object({
      nationalId:      t.Optional(t.String()),
      address:         t.Optional(t.String()),
      grossIncome:     t.Optional(t.String()),
      maritalStatus:   t.Optional(t.String()),
      childCount:      t.Optional(t.Number()),
      lifeInsurance:   t.Optional(t.String()),
      healthInsurance: t.Optional(t.String()),
      socialSecurity:  t.Optional(t.String()),
      ssf:             t.Optional(t.String()),
      rmf:             t.Optional(t.String()),
    })
  })

  // GET /tax/insights — สรุปค่าใช้จ่ายลดหย่อนภาษี YTD + breakdown
  // Query: ?year=2026 (default = ปีปัจจุบัน)
  .get('/insights', async ({ userId, query }) => {
    const year = query.year ? Number(query.year) : new Date().getFullYear()
    const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
    const yearEnd   = new Date(Date.UTC(year, 11, 31, 23, 59, 59))

    const baseWhere = and(
      eq(transactions.userId, userId),
      eq(transactions.isTaxDeductible, true),
      eq(transactions.type, 'expense'),
      gte(transactions.date, yearStart),
      lte(transactions.date, yearEnd),
    )

    // ── 1) Total YTD ──
    const [totals] = await db
      .select({
        totalAmount: sum(transactions.amount),
        totalCount:  count(transactions.id),
      })
      .from(transactions)
      .where(baseWhere)

    // ── 2) Breakdown by category ──
    const breakdown = await db
      .select({
        categoryId:   transactions.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        amount:       sum(transactions.amount),
        count:        count(transactions.id),
      })
      .from(transactions)
      .leftJoin(categories, eq(categories.id, transactions.categoryId))
      .where(baseWhere)
      .groupBy(transactions.categoryId, categories.name, categories.slug)

    // ── 3) Monthly trend ──
    const monthly = await db
      .select({
        month:  sql<string>`to_char(${transactions.date}, 'YYYY-MM')`.as('month'),
        amount: sum(transactions.amount),
        count:  count(transactions.id),
      })
      .from(transactions)
      .where(baseWhere)
      .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
      .orderBy(sql`month`)

    return {
      data: {
        year,
        totalAmount: Number(totals?.totalAmount ?? 0),
        totalCount:  Number(totals?.totalCount ?? 0),
        breakdown: breakdown.map(b => ({
          categoryId:   b.categoryId,
          categoryName: b.categoryName ?? 'ไม่ระบุ',
          categorySlug: b.categorySlug ?? null,
          amount:       Number(b.amount ?? 0),
          count:        Number(b.count ?? 0),
        })),
        monthly: monthly.map(m => ({
          month:  m.month,
          amount: Number(m.amount ?? 0),
          count:  Number(m.count ?? 0),
        })),
      },
    }
  }, {
    query: t.Object({
      year: t.Optional(t.String()),
    }),
  })

  // POST /tax/calculate — คำนวณภาษี (ต้อง auth)
  .post('/calculate', async ({ body, userId, set }) => {
    if (!userId) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
    const result = calculateThai(
      Number(body.grossIncome),
      body.deductions,
    )
    return { data: result }
  }, {
    body: t.Object({
      grossIncome: t.Union([t.String(), t.Number()]),
      deductions:  t.Array(t.Object({
        id:       t.String(),
        label:    t.String(),
        category: t.String(),
        amount:   t.Number(),
      })),
    })
  })