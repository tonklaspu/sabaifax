import { Elysia, t } from 'elysia'
import { db } from '../db/client'
import { wallets } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'

export const walletRoute = new Elysia({ prefix: '/wallets' })

  // คำนวณยอด balance แบบ dynamic ผ่าน SQL aggregate
  // - income:   +amount บน wallet_id
  // - expense:  -amount บน wallet_id
  // - transfer: -amount บน wallet_id (ต้นทาง) และ +amount บน to_wallet_id (ปลายทาง)
  .get('/', async ({ userId }) => {
    const rows = await db.execute(sql`
      WITH deltas AS (
        SELECT wallet_id AS wid,
          SUM(CASE
            WHEN type = 'income'   THEN amount
            WHEN type = 'expense'  THEN -amount
            WHEN type = 'transfer' THEN -amount
            ELSE 0
          END) AS d
        FROM transactions
        WHERE user_id = ${userId} AND wallet_id IS NOT NULL
        GROUP BY wallet_id

        UNION ALL

        SELECT to_wallet_id AS wid, SUM(amount) AS d
        FROM transactions
        WHERE user_id = ${userId}
          AND type = 'transfer'
          AND to_wallet_id IS NOT NULL
        GROUP BY to_wallet_id
      ),
      wallet_deltas AS (
        SELECT wid, SUM(d) AS total_delta FROM deltas GROUP BY wid
      )
      SELECT
        w.*,
        (COALESCE(w.balance, 0) + COALESCE(wd.total_delta, 0))::text AS computed_balance
      FROM wallets w
      LEFT JOIN wallet_deltas wd ON wd.wid = w.id
      WHERE w.user_id = ${userId}
      ORDER BY w.created_at ASC
    `)

    const data = (rows as any[]).map(r => ({
      id:        r.id,
      userId:    r.user_id,
      name:      r.name,
      type:      r.type,
      icon:      r.icon,
      color:     r.color,
      balance:   r.computed_balance ?? '0',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))

    return { data }
  })

  .post('/', async ({ userId, body }) => {
    const [wallet] = await db
      .insert(wallets)
      .values({ ...body, balance: body.balance != null ? String(body.balance) : undefined, userId })
      .returning()
    return { data: wallet }
  }, {
    body: t.Object({
      name:    t.String(),
      type:    t.Optional(t.String()),
      balance: t.Optional(t.Union([t.String(), t.Number()])),
      icon:    t.Optional(t.String()),
      color:   t.Optional(t.String()),
    })
  })

  .put('/:id', async ({ userId, params, body }) => {
    const [updated] = await db
      .update(wallets)
      .set({ ...body, balance: body.balance != null ? String(body.balance) : undefined, updatedAt: new Date() })
      .where(and(
        eq(wallets.id, params.id),
        eq(wallets.userId, userId),
      ))
      .returning()
    return { data: updated }
  }, {
    body: t.Object({
      name:    t.Optional(t.String()),
      balance: t.Optional(t.Union([t.String(), t.Number()])),
      icon:    t.Optional(t.String()),
      color:   t.Optional(t.String()),
    })
  })

  .delete('/:id', async ({ userId, params }) => {
    await db
      .delete(wallets)
      .where(and(
        eq(wallets.id, params.id),
        eq(wallets.userId, userId),
      ))
    return { success: true }
  })