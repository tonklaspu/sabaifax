import { Elysia, t } from 'elysia'
import { db } from '../db/client'
import { budgets } from '../db/schema'
import { eq } from 'drizzle-orm'

export const budgetRoute = new Elysia({ prefix: '/budget' })

  // GET /budget — ดึง budget ของ user
  .get('/', async ({ userId }) => {
    const [budget] = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId))

    return { data: budget ?? null }
  })

  // PUT /budget — ตั้งค่า budget (upsert)
  .put('/', async ({ userId, body }) => {
    const existing = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId))

    if (existing.length > 0) {
      const [updated] = await db
        .update(budgets)
        .set({
          monthlyLimit: String(body.monthlyLimit),
          updatedAt: new Date(),
        })
        .where(eq(budgets.userId, userId))
        .returning()
      return { data: updated }
    }

    const [created] = await db
      .insert(budgets)
      .values({
        userId,
        monthlyLimit: String(body.monthlyLimit),
      })
      .returning()

    return { data: created }
  }, {
    body: t.Object({
      monthlyLimit: t.Union([t.String(), t.Number()]),
    })
  })
