import TextRecognition from '@react-native-ml-kit/text-recognition'
import { parseSlip } from '../utils/slip-parser'

export interface OcrResult {
  rawText: string
  amount: number | null
  allAmounts: number[]
  merchantName: string | null
  date: string | null
  isSlip: boolean
  bank: string
  slipRef: string | null       // เลขอ้างอิงสลิป (สำหรับ duplicate detection)
}

// ── Helpers ────────────────────────────────────────────

/** ดึงตัวเลขทั้งหมดในข้อความ (สำหรับ allAmounts) */
function extractAllAmounts(text: string): number[] {
  const pattern = /\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\b|\b\d+(?:\.\d{1,2})?\b/g
  const matches = text.match(pattern) ?? []
  return matches
    .map(m => parseFloat(m.replace(/,/g, '')))
    .filter(n => n > 0 && n < 10_000_000)
}

/** ดึงชื่อร้าน — บรรทัดบนสุดที่ไม่ใช่ตัวเลขล้วน */
function extractMerchantName(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  // บรรทัดที่เป็น date/time: มีตัวเลขขึ้นต้น + เดือนย่อ/colon/จุด — ข้ามทิ้ง
  const dateLike = /^\d{1,2}[\s.\-/](?:[A-Za-zก-๙.]{1,6}|\d{1,2})[\s.\-/]\d{2,4}/
  const timeLike = /\d{1,2}:\d{2}/
  for (const line of lines.slice(0, 5)) {
    if (line.length < 3) continue
    if (/^\d[\d\s,./:-]*$/.test(line)) continue
    if (dateLike.test(line)) continue
    if (timeLike.test(line)) continue
    return line
  }
  return null
}

// ── Main ───────────────────────────────────────────────

export async function recognizeReceipt(imageUri: string): Promise<OcrResult> {
  const result  = await TextRecognition.recognize(imageUri)
  const rawText = result.text ?? ''

  // ใช้ slip-parser สำหรับ amount / date / isSlip / bank
  const parsed = parseSlip(rawText)

  return {
    rawText,
    amount:       parsed.amount,
    allAmounts:   extractAllAmounts(rawText),
    merchantName: extractMerchantName(rawText),
    date:         parsed.date,
    isSlip:       parsed.isSlip,
    bank:         parsed.bank,
    slipRef:      parsed.slipRef,
  }
}
