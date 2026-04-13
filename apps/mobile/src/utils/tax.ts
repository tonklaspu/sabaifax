// ── Thai Personal Income Tax Calculator (2025) ────────────────────────────────
// อ้างอิง: ประมวลรัษฎากร มาตรา 48

export interface TaxDeduction {
  id: string
  label: string
  category: TaxDeductionCategory
  amount: number
}

export type TaxDeductionCategory =
  | 'expense'       // ค่าใช้จ่าย 50% ไม่เกิน 100,000
  | 'personal'      // ค่าลดหย่อนส่วนตัว 60,000
  | 'spouse'        // คู่สมรส 60,000
  | 'child'         // บุตร 30,000/คน
  | 'parent'        // เลี้ยงดูบิดามารดา 30,000/คน
  | 'lifeInsurance' // เบี้ยประกันชีวิต ไม่เกิน 100,000
  | 'healthInsurance' // เบี้ยประกันสุขภาพ ไม่เกิน 25,000
  | 'providentFund' // กองทุนสำรองเลี้ยงชีพ ไม่เกิน 500,000
  | 'rmf'           // RMF ไม่เกิน 30% ของรายได้ และไม่เกิน 500,000
  | 'ssf'           // SSF ไม่เกิน 30% ของรายได้ และไม่เกิน 200,000
  | 'socialSecurity' // ประกันสังคม ไม่เกิน 9,000
  | 'mortgage'      // ดอกเบี้ยบ้าน ไม่เกิน 100,000
  | 'donation'      // เงินบริจาค ไม่เกิน 10% ของรายได้หลังหักลดหย่อน
  | 'easyEReceipt'  // Easy E-Receipt ไม่เกิน 50,000
  | 'other'

// อัตราภาษีเงินได้บุคคลธรรมดา 2568
const TAX_BRACKETS: { min: number; max: number; rate: number }[] = [
  { min: 0,         max: 150_000,   rate: 0.00 },
  { min: 150_000,   max: 300_000,   rate: 0.05 },
  { min: 300_000,   max: 500_000,   rate: 0.10 },
  { min: 500_000,   max: 750_000,   rate: 0.15 },
  { min: 750_000,   max: 1_000_000, rate: 0.20 },
  { min: 1_000_000, max: 2_000_000, rate: 0.25 },
  { min: 2_000_000, max: 5_000_000, rate: 0.30 },
  { min: 5_000_000, max: Infinity,  rate: 0.35 },
]

export interface TaxResult {
  grossIncome: number        // รายได้รวม
  expenseDeduction: number   // หักค่าใช้จ่าย 50%
  totalDeductions: number    // ลดหย่อนรวม
  netIncome: number          // รายได้สุทธิ
  taxBeforeCredit: number    // ภาษีก่อนหักเครดิต
  tax: number                // ภาษีที่ต้องชำระ
  effectiveRate: number      // อัตราภาษีที่แท้จริง (%)
  brackets: { label: string; income: number; rate: number; tax: number }[]
}

export function calculateThai(
  grossIncome: number,
  deductions: TaxDeduction[],
): TaxResult {
  // 1. หักค่าใช้จ่าย 50% ไม่เกิน 100,000
  const expenseDeduction = Math.min(grossIncome * 0.5, 100_000)

  // 2. รวมลดหย่อน (ไม่รวม expense ที่คำนวณแยก)
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0)

  // 3. รายได้สุทธิ
  const netIncome = Math.max(0, grossIncome - expenseDeduction - totalDeductions)

  // 4. คำนวณภาษีตามขั้น
  let tax = 0
  const brackets: TaxResult['brackets'] = []
  for (const b of TAX_BRACKETS) {
    if (netIncome <= b.min) break
    const taxable = Math.min(netIncome, b.max) - b.min
    const bracketTax = taxable * b.rate
    tax += bracketTax
    if (b.rate > 0) {
      brackets.push({
        label: `${(b.min / 1000).toFixed(0)}k – ${b.max === Infinity ? '∞' : (b.max / 1000).toFixed(0) + 'k'}`,
        income: taxable,
        rate: b.rate * 100,
        tax: bracketTax,
      })
    }
  }

  const effectiveRate = grossIncome > 0 ? (tax / grossIncome) * 100 : 0

  return {
    grossIncome,
    expenseDeduction,
    totalDeductions,
    netIncome,
    taxBeforeCredit: tax,
    tax,
    effectiveRate,
    brackets,
  }
}

// Default deductions สำหรับ ผู้มีเงินได้ทั่วไป
export const DEFAULT_DEDUCTIONS: TaxDeduction[] = [
  { id: 'personal', label: 'ค่าลดหย่อนส่วนตัว', category: 'personal', amount: 60_000 },
  { id: 'socialSecurity', label: 'ประกันสังคม', category: 'socialSecurity', amount: 9_000 },
]

export const DEDUCTION_CAPS: Record<TaxDeductionCategory, number> = {
  expense:         100_000,
  personal:         60_000,
  spouse:           60_000,
  child:            30_000, // per child
  parent:           30_000, // per parent
  lifeInsurance:   100_000,
  healthInsurance:  25_000,
  providentFund:   500_000,
  rmf:             500_000,
  ssf:             200_000,
  socialSecurity:    9_000,
  mortgage:        100_000,
  donation:              0, // คำนวณ 10% ของรายได้หลังหักลดหย่อน
  easyEReceipt:     50_000,
  other:                 0,
}

export function formatThb(amount: number): string {
  return `฿${Math.round(amount).toLocaleString('th-TH')}`
}
