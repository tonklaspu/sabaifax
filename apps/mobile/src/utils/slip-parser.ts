// src/utils/slip-parser.ts

export interface ParsedSlip {
  amount:  number | null
  date:    string | null
  isSlip:  boolean
  bank:    string
  slipRef: string | null     // Ref No. / Transaction ID — สำหรับ duplicate detection
}

export function parseSlip(rawText: string): ParsedSlip {
  return {
    amount:  extractAmount(rawText),
    date:    extractDate(rawText),
    isSlip:  detectSlip(rawText),
    bank:    detectBank(rawText),
    slipRef: extractRefNo(rawText),
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
  if (text.includes('K PLUS') || text.includes('กสิกร'))           return 'KBANK'
  if (text.includes('SCB')    || text.includes('ไทยพาณิชย์'))      return 'SCB'
  if (text.includes('กรุงไทย') || text.includes('Krungthai'))      return 'KTB'
  if (text.includes('กรุงเทพ') || text.includes('Bangkok Bank'))   return 'BBL'
  if (text.includes('กรุงศรี') || text.includes('Krungsri'))       return 'BAY'
  if (text.includes('ทหารไทย') || text.includes('TTB'))            return 'TTB'
  if (text.includes('PromptPay') || text.includes('พร้อมเพย์'))    return 'PROMPTPAY'
  return 'UNKNOWN'
}

// ── จับยอดเงิน (อัปเกรดความแม่นยำ) ────────────────
function extractAmount(text: string): number | null {
  const patterns = [
    /฿\s*([\d,]+(?:\.\d{1,2})?)/,
    /THB\s*([\d,]+(?:\.\d{1,2})?)/i,
    /จำนวนเงิน[^\d]*([\d,]+(?:\.\d{1,2})?)/,
    /ยอดเงิน[^\d]*([\d,]+(?:\.\d{1,2})?)/,
    /amount[^\d]*([\d,]+(?:\.\d{1,2})?)/i,
    /(?<!\d)([1-9]\d{0,2}(?:,\d{3})+|[1-9]\d*)\.\d{2}(?!\d)/,
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

// ── จับเลขอ้างอิงสลิป (Ref No.) ────────────────────
/**
 * ดึงเลขอ้างอิงธุรกรรม/สลิปจาก OCR text
 * รองรับรูปแบบที่พบบ่อยของธนาคารไทย:
 *  - "เลขที่รายการ" / "รหัสอ้างอิง" / "Ref No." / "Transaction ID"
 *  - PromptPay reference (15-20 หลัก)
 *  - เลขอ้างอิงทั่วไปของ SCB/KBANK/BBL/KTB/BAY/TTB (ผสมตัวอักษร+ตัวเลข 10-25 หลัก)
 */
function extractRefNo(text: string): string | null {
  const patterns: RegExp[] = [
    // Label-based (แม่นสุด)
    /(?:เลขที่รายการ|รหัสอ้างอิง|หมายเลขอ้างอิง|เลขอ้างอิง)[\s:：]*([A-Z0-9]{8,25})/i,
    /Ref(?:erence)?\.?\s*(?:No\.?|Number)?[\s:：]*([A-Z0-9]{8,25})/i,
    /Transaction\s*(?:ID|No\.?|Number)[\s:：]*([A-Z0-9]{8,25})/i,

    // PromptPay (เลขล้วน 15-20 หลัก)
    /(?:พร้อมเพย์|PromptPay)[^\d]*(\d{15,20})/i,

    // K PLUS: เลขอ้างอิงมักขึ้นต้นตามรูปแบบเฉพาะ (เช่น 01xxxxxxxxxxxxxxxx)
    /(?<![A-Z0-9])(\d{20,25})(?![A-Z0-9])/,
  ]

  for (const p of patterns) {
    const m = text.match(p)
    if (m && m[1]) {
      const ref = m[1].toUpperCase().trim()
      // ป้องกัน false positive (เช่น เบอร์โทร / เลขบัญชี 10 หลัก)
      if (ref.length >= 8) return ref
    }
  }
  return null
}
