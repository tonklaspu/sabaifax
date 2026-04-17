import { Elysia, t } from 'elysia'
import { calculateThai } from '../../../mobile/src/utils/tax'
import { db } from '../db/client'
import { taxProfiles } from '../db/schema'
import { eq } from 'drizzle-orm'

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