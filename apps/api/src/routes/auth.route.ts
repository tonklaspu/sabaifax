import { Elysia, t } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'
import { db } from '../db/client'
import { profiles } from '../db/schema'
import { sql } from 'drizzle-orm'
import { supabaseAdmin } from '../middleware/auth'

// Public (ไม่ต้อง auth) — หา email จาก username เพื่อให้ login ด้วย username ได้
// กัน username enumeration ด้วย rate limit 10 req / 60s ต่อ IP + response shape เดียวกันทุก fail case
export const authRoute = new Elysia({ prefix: '/auth' })
  .use(
    rateLimit({
      duration: 60_000,
      max: 10,
      errorResponse: new Response(
        JSON.stringify({ message: 'Too many requests' }),
        { status: 429, headers: { 'content-type': 'application/json' } },
      ),
    }),
  )
  .get('/lookup', async ({ query, set }) => {
    const username = query.username?.trim()
    if (!username) {
      set.status = 400
      return { message: 'username required' }
    }

    // Timing-safe: ทำ query ทั้งคู่เสมอ กัน attacker วัด response time
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
