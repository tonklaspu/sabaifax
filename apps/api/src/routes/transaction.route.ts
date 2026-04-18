import { Elysia, t } from 'elysia'
import { db } from '../db/client'
import { transactions } from '../db/schema'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { generateReceiptHash } from '../utils/receipt-hash'

export const transactionRoute = new Elysia({ prefix: '/transactions' })

  // GET /transactions — ดึงรายการทั้งหมด
  .get('/', async ({ userId, query }) => {
    const { type, limit = '20', offset = '0', from, to } = query

    const conditions: any[] = [eq(transactions.userId, userId)]

    if (type)      conditions.push(eq(transactions.type, type as any))
    if (from)      conditions.push(gte(transactions.date, new Date(from)))
    if (to)        conditions.push(lte(transactions.date, new Date(to)))
    if (query.wallet_id) conditions.push(eq(transactions.walletId, query.wallet_id))

    const data = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(Number(limit))
      .offset(Number(offset))

    return { data }
  }, {
    query: t.Object({
      type:   t.Optional(t.String()),
      limit:  t.Optional(t.String()),
      offset: t.Optional(t.String()),
      from:   t.Optional(t.String()),
      to:     t.Optional(t.String()),
      sort:   t.Optional(t.String()),
      wallet_id: t.Optional(t.String()),
    })
  })

  // POST /transactions — สร้างรายการใหม่ (+ Duplicate Protection)
  .post('/', async ({ userId, body, set }) => {
    const amt    = Number(body.amount)
    const txDate = body.date ? new Date(body.date) : new Date()
    const { bank, force, slipRef, ...rest } = body

    // ── Layer 2: Slip Reference Number (Hard Reject) ──
    if (slipRef) {
      const existing = await db
        .select({ id: transactions.id, date: transactions.date, amount: transactions.amount })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.slipRef, slipRef),
        ))
        .limit(1)

      if (existing.length > 0) {
        set.status = 409
        return {
          error: 'DUPLICATE_SLIP_REF',
          message: 'สลิปนี้เคยถูกบันทึกแล้ว (Ref ซ้ำ)',
          duplicate: existing[0],
        }
      }
    }

    // ── Layer 3: Content Hash (Soft Warning ±24h) ──
    const hash = generateReceiptHash({ amount: amt, date: txDate, bank })

    if (!force && hash) {
      const windowStart = new Date(txDate.getTime() - 24 * 3600 * 1000)
      const windowEnd   = new Date(txDate.getTime() + 24 * 3600 * 1000)

      const similar = await db
        .select({ id: transactions.id, date: transactions.date, amount: transactions.amount, note: transactions.note })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.receiptHash, hash),
          gte(transactions.date, windowStart),
          lte(transactions.date, windowEnd),
        ))
        .limit(1)

      if (similar.length > 0) {
        set.status = 409
        return {
          error: 'POSSIBLE_DUPLICATE',
          message: 'พบรายการที่คล้ายกันในช่วง 24 ชม. — ยืนยันบันทึกซ้ำได้โดยส่ง force=true',
          duplicate: similar[0],
          canForce: true,
        }
      }
    }

    // ── Insert ──
    const [tx] = await db
      .insert(transactions)
      .values({
        ...rest,
        amount: String(amt),
        date:   txDate,
        userId,
        slipRef:     slipRef ?? null,
        receiptHash: hash,
      })
      .returning()

    return { data: tx }
  }, {
    body: t.Object({
      walletId:        t.Optional(t.String()),
      categoryId:      t.Optional(t.String()),
      toWalletId:      t.Optional(t.String()),
      type:            t.Union([t.Literal('expense'), t.Literal('income'), t.Literal('transfer')]),
      amount:          t.Union([t.String(), t.Number()]),
      note:            t.Optional(t.String()),
      date:            t.Optional(t.String()),
      isTaxDeductible: t.Optional(t.Boolean()),
      receiptUrl:      t.Optional(t.String()),
      // ── Duplicate Protection (Epic 1) ──
      slipRef:         t.Optional(t.String()),   // Layer 2 — เลขอ้างอิงสลิป
      bank:            t.Optional(t.String()),   // ใช้คำนวณ hash เท่านั้น (ไม่เก็บ column)
      force:           t.Optional(t.Boolean()),  // ข้าม Layer 3 soft warning
    })
  })

  // PUT /transactions/:id — แก้ไขรายการ
  .put('/:id', async ({ userId, params, body }) => {
    const values: Record<string, unknown> = { updatedAt: new Date() }
    if (body.type != null)            values.type = body.type
    if (body.amount != null)          values.amount = String(body.amount)
    if (body.note !== undefined)      values.note = body.note
    if (body.date != null)            values.date = new Date(body.date)
    if (body.walletId !== undefined)  values.walletId = body.walletId
    if (body.categoryId !== undefined) values.categoryId = body.categoryId
    if (body.toWalletId !== undefined) values.toWalletId = body.toWalletId
    if (body.isTaxDeductible !== undefined) values.isTaxDeductible = body.isTaxDeductible

    const [updated] = await db
      .update(transactions)
      .set(values)
      .where(and(
        eq(transactions.id, params.id),
        eq(transactions.userId, userId),
      ))
      .returning()

    return { data: updated }
  }, {
    body: t.Object({
      walletId:        t.Optional(t.String()),
      categoryId:      t.Optional(t.String()),
      toWalletId:      t.Optional(t.String()),
      type:            t.Optional(t.Union([t.Literal('expense'), t.Literal('income'), t.Literal('transfer')])),
      amount:          t.Optional(t.Union([t.String(), t.Number()])),
      note:            t.Optional(t.String()),
      date:            t.Optional(t.String()),
      isTaxDeductible: t.Optional(t.Boolean()),
    })
  })

  // DELETE /transactions/:id — ลบรายการ
  .delete('/:id', async ({ userId, params }) => {
    await db
      .delete(transactions)
      .where(and(
        eq(transactions.id, params.id),
        eq(transactions.userId, userId),
      ))

    return { success: true }
  })