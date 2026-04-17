import { Elysia, t } from 'elysia'
import { db } from '../db/client'
import { pushTokens } from '../db/schema'
import { eq, and } from 'drizzle-orm'

export const pushTokenRoute = new Elysia({ prefix: '/push-tokens' })

  // POST /push-tokens — register/update push token
  .post('/', async ({ userId, body }) => {
    // Upsert: delete old token for this user+token, then insert
    await db
      .delete(pushTokens)
      .where(and(
        eq(pushTokens.userId, userId),
        eq(pushTokens.token, body.token),
      ))

    const [row] = await db
      .insert(pushTokens)
      .values({
        userId,
        token: body.token,
        platform: body.platform,
      })
      .returning()

    return { data: row }
  }, {
    body: t.Object({
      token:    t.String(),
      platform: t.Optional(t.String()),
    })
  })

  // DELETE /push-tokens?token=xxx — remove push token (e.g. on logout)
  .delete('/', async ({ userId, query }) => {
    await db
      .delete(pushTokens)
      .where(and(
        eq(pushTokens.userId, userId),
        eq(pushTokens.token, query.token),
      ))

    return { success: true }
  }, {
    query: t.Object({
      token: t.String(),
    })
  })
