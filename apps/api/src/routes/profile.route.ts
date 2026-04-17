import { Elysia, t } from 'elysia'
import { db } from '../db/client'
import { profiles } from '../db/schema'
import { eq } from 'drizzle-orm'

export const profileRoute = new Elysia({ prefix: '/profile' })

  .get('/', async ({ userId }) => {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
    return { data: profile ?? null }
  })

  .put('/', async ({ userId, body, set }) => {
    const values: Record<string, unknown> = {}
    if (body.username != null)  values.username  = body.username.trim() || null
    if (body.firstName != null) values.firstName = body.firstName.trim() || null
    if (body.lastName != null)  values.lastName  = body.lastName.trim() || null

    // derive fullName
    if (body.firstName != null || body.lastName != null) {
      const fn = (body.firstName ?? '').trim()
      const ln = (body.lastName ?? '').trim()
      values.fullName = [fn, ln].filter(Boolean).join(' ') || null
    } else if (body.fullName != null) {
      values.fullName = body.fullName.trim() || null
    }

    try {
      const [updated] = await db
        .update(profiles)
        .set(values)
        .where(eq(profiles.id, userId))
        .returning()
      return { data: updated }
    } catch (e: any) {
      // unique constraint — username ซ้ำ
      if (e?.code === '23505' || /duplicate|unique/i.test(e?.message ?? '')) {
        set.status = 409
        return { message: 'ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว' }
      }
      throw e
    }
  }, {
    body: t.Object({
      username:  t.Optional(t.String()),
      firstName: t.Optional(t.String()),
      lastName:  t.Optional(t.String()),
      fullName:  t.Optional(t.String()),
    })
  })