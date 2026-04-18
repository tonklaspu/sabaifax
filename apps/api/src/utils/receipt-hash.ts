import { createHash } from 'node:crypto'

/**
 * สร้าง fingerprint สำหรับตรวจจับสลิปซ้ำ (Layer 3 — Soft Warning)
 *
 * รวม amount (2 ตำแหน่งทศนิยม) + วันที่ (YYYY-MM-DD) + ธนาคาร (uppercase)
 * — ถ้า 3 ค่านี้ตรงกันในช่วง ±24ชม. ถือว่าอาจเป็นรายการซ้ำ
 *
 * หมายเหตุ: เป็น soft warning ให้ผู้ใช้ตัดสินใจ ไม่ใช่ hard reject
 *           เพราะผู้ใช้อาจจ่ายยอดเดิมซ้ำในวันเดียวกันจริงๆ (เช่น 2 บิล)
 */
export function generateReceiptHash(params: {
  amount: number | string
  date: Date | string
  bank?: string | null
}): string {
  const amount = Number(params.amount).toFixed(2)
  const day    = new Date(params.date).toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  const bank   = (params.bank ?? 'UNKNOWN').toUpperCase().trim()

  return createHash('sha256')
    .update(`${amount}|${day}|${bank}`)
    .digest('hex')
}
