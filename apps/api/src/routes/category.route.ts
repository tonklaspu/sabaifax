
import { Elysia, t } from 'elysia'
import { db } from '../db/client'
import { categories } from '../db/schema'
import { eq, or, isNull, and } from 'drizzle-orm'

export const categoryRoute = new Elysia({ prefix: '/categories' })

  .get('/', async ({ userId }) => {
    const data = await db
      .select()
      .from(categories)
      .where(
        or(
          eq(categories.userId, userId),
          isNull(categories.userId), // default categories
        )
      )
    return { data }
  })

  .post('/', async ({ userId, body }) => {
    const [category] = await db
      .insert(categories)
      .values({ ...body, userId })
      .returning()
    return { data: category }
  }, {
    body: t.Object({
      name: t.String(),
      icon: t.Optional(t.String()),
      type: t.Union([
        t.Literal('expense'),
        t.Literal('income'),
        t.Literal('transfer'),
      ]),
    })
  })

  .delete('/:id', async ({ userId, params }) => {
    await db
      .delete(categories)
      .where(and(
        eq(categories.id, params.id),
        eq(categories.userId, userId),
      ))
    return { success: true }
  })