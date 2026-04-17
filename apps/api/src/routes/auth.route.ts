import { Elysia, t } from 'elysia'
import { db } from '../db/client'
import { profiles } from '../db/schema'
import { sql } from 'drizzle-orm'
import { supabaseAdmin } from '../middleware/auth'

// Public (ไม่ต้อง auth) — หา email จาก username เพื่อให้ login ด้วย username ได้
// Timing-safe: query ทั้งคู่เสมอ + fail response shape เดียว เพื่อลด username enumeration
export const authRoute = new Elysia({ prefix: '/auth' })
  .get('/lookup', async ({ query, set }) => {
    const username = query.username?.trim()
    if (!username) {
      set.status = 400
      return { message: 'username required' }
    }

    const byUsername = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(sql`lower(${profiles.username}) = lower(${username})`)
      .limit(1)

    const byFull = byUsername[0]
      ? [byUsername[0]]
      : await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(sql`lower(${profiles.fullName}) = lower(${username})`)
          .limit(1)

    const row = byUsername[0] ?? byFull[0]

    const notFound = () => {
      set.status = 404
      return { message: 'not found' }
    }

    if (!row) return notFound()

    const { data, error } = await supabaseAdmin.auth.admin.getUserById(row.id)
    if (error || !data?.user?.email) return notFound()

    return { email: data.user.email }
  }, {
    query: t.Object({ username: t.String() }),
  })
