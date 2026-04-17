// src/utils/slip-parser.ts

export function parseSlip(rawText: string) {
  const lines = rawText.split('\n').map(l => l.trim())

  return {
    // จับยอดเงิน — หา ฿ หรือ บาท
    amount: extractAmount(rawText),

    // จับวันที่ — หา dd/mm/yy หรือ dd มี.ค. 67
    date: extractDate(rawText),

    // ตรวจว่าเป็นสลิปไหม
    isSlip: detectSlip(rawText),

    // ตรวจธนาคาร
    bank: detectBank(rawText),
  }
}

// ── ตรวจว่าเป็นสลิปโอนเงิน ──────────────────────
function detectSlip(text: string): boolean {
  const keywords = [
    'โอนเงินสำเร็จ',
    'รายการสำเร็จ',
    'ชำระเงินสำเร็จ',
    'Transfer successful',
    'Payment successful',
  ]
  return keywords.some(k => text.includes(k))
}

// ── ตรวจธนาคาร ────────────────────────────────────
function detectBank(text: string): string {
  if (text.includes('K PLUS') || text.includes('กสิกร')) return 'KBANK'
  if (text.includes('SCB') || text.includes('ไทยพาณิชย์')) return 'SCB'
  if (text.includes('กรุงไทย') || text.includes('Krungthai')) return 'KTB'
  if (text.includes('กรุงเทพ') || text.includes('Bangkok Bank')) return 'BBL'
  if (text.includes('ทหารไทย') || text.includes('TTB')) return 'TTB'
  return 'unknown'
}

// ── จับยอดเงิน (อัปเกรดความแม่นยำ) ────────────────
function extractAmount(text: string): number | null {
  const patterns = [
    /฿\s*([\d,]+(?:\.\d{1,2})?)/,                              // ฿1,200.00
    /THB\s*([\d,]+(?:\.\d{1,2})?)/i,                           // THB 1,200.00
    /จำนวนเงิน[^\d]*([\d,]+(?:\.\d{1,2})?)/,                  // จำนวนเงิน (บาท) 1,200
    /ยอดเงิน[^\d]*([\d,]+(?:\.\d{1,2})?)/,                    // ยอดเงิน 1,200
    /amount[^\d]*([\d,]+(?:\.\d{1,2})?)/i,                     // Amount: 1,200
    /(?<!\d)([1-9]\d{0,2}(?:,\d{3})+|[1-9]\d*)\.\d{2}(?!\d)/, // ท่าไม้ตาย: ตัวเลขที่มีทศนิยม 2 ตำแหน่ง
  ]

  for (const p of patterns) {
    const m = text.match(p)
    if (m && m[1]) return parseFloat(m[1].replace(/,/g, ''))
  }
  return null
}

// ── จับวันที่ (อัปเกรดเผื่อ OCR อ่านจุดไม่ออก) ────────
function extractDate(text: string): string | null {
  const patterns = [
    /(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{2,4})/,
    /(\d{1,2})\s+(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)\s+(\d{2,4})/,
  ]

  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[0]
  }
  return null
}
