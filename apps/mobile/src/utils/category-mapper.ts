// src/utils/category-mapper.ts
// Epic 2 — Auto-Categorization via merchant keyword → category slug

export interface CategoryRule {
  slug: string
  fallbackLabel: string    // ชื่อไทยที่ match กับ default categories ใน category.store.ts
  keywords: string[]
}

/**
 * Rules จัดเรียงตาม priority (อันแรก match ก่อน)
 * keyword case-insensitive, match แบบ "contains" (substring)
 */
export const CATEGORY_RULES: CategoryRule[] = [
  {
    slug: 'food',
    fallbackLabel: 'อาหาร',
    keywords: [
      '7-eleven', '7eleven', 'seven', 'เซเว่น', 'cp all', 'ซีพี',
      'lotus', 'โลตัส', 'big c', 'บิ๊กซี', 'tesco', 'makro', 'แม็คโคร',
      'tops', 'villa', 'foodland', 'gourmet',
      'foodpanda', 'grabfood', 'lineman', 'robinhood',
      'mcdonald', 'kfc', 'burger', 'pizza', 'mk', 'shabu', 'sukiya',
      'อาหาร', 'ร้านอาหาร', 'ข้าว', 'ก๋วยเตี๋ยว',
      'cafe', 'คาเฟ่', 'coffee', 'กาแฟ', 'starbucks', 'amazon coffee',
    ],
  },
  {
    slug: 'transport',
    fallbackLabel: 'เดินทาง',
    keywords: [
      'ptt', 'ปตท', 'bangchak', 'บางจาก', 'shell', 'เชลล์',
      'esso', 'caltex', 'pt station',
      'bts', 'mrt', 'srt', 'arl', 'รถไฟ', 'รถเมล์', 'ขสมก',
      'grab', 'bolt', 'lineman taxi', 'taxi', 'แท็กซี่',
      'น้ำมัน', 'เติมน้ำมัน', 'ทางด่วน', 'easy pass', 'mpass',
    ],
  },
  {
    slug: 'shopping',
    fallbackLabel: 'ช้อปปิ้ง',
    keywords: [
      'shopee', 'lazada', 'tiktok shop',
      'central', 'เซ็นทรัล', 'the mall', 'siam paragon', 'emporium',
      'robinson', 'โรบินสัน', 'terminal 21', 'icon siam',
      'uniqlo', 'zara', 'h&m', 'muji', 'gu', 'decathlon',
    ],
  },
  {
    slug: 'utility',
    fallbackLabel: 'ค่าน้ำ/ไฟ',
    keywords: [
      'มิเตอร์', 'electricity', 'กฟภ', 'กฟน', 'mea', 'pea',
      'ค่าไฟ', 'การไฟฟ้า',
      'water', 'ประปา', 'ค่าน้ำ', 'mwa', 'pwa',
      'true', 'ทรู', 'ais', 'เอไอเอส', 'dtac', 'ดีแทค', 'nt',
      'internet', '3bb', 'netflix', 'spotify', 'youtube premium', 'disney',
    ],
  },
  {
    slug: 'health',
    fallbackLabel: 'สุขภาพ',
    keywords: [
      'โรงพยาบาล', 'hospital', 'clinic', 'คลินิก',
      'watsons', 'วัตสัน', 'boots', 'บู๊ทส์',
      'pharmacy', 'ร้านยา', 'เภสัช',
      'bumrungrad', 'samitivej', 'bangkok hospital', 'vejthani',
    ],
  },
  {
    slug: 'entertainment',
    fallbackLabel: 'บันเทิง',
    keywords: [
      'major', 'sf cinema', 'เมเจอร์', 'โรงหนัง', 'หนัง',
      'bowling', 'karaoke', 'คาราโอเกะ',
      'netflix', 'disney+', 'youtube premium',
    ],
  },
]

/**
 * Suggest หมวดหมู่ (slug) จากข้อความ (ชื่อร้าน/OCR raw/note)
 * คืน null ถ้าไม่เจอ keyword ที่ตรง
 */
export function suggestCategorySlug(text: string | null | undefined): string | null {
  if (!text) return null
  const lower = text.toLowerCase()

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => lower.includes(k.toLowerCase()))) {
      return rule.slug
    }
  }
  return null
}

/**
 * แปลง slug → category จาก list ที่ fetch มา
 * ลองจับคู่ด้วย slug ก่อน ถ้าไม่เจอจึง fallback ไปหา label ตรงๆ
 */
export function resolveCategoryBySlug<T extends { slug?: string | null; label?: string; name?: string }>(
  slug: string | null,
  categories: T[],
): T | null {
  if (!slug) return null

  // 1) จับคู่ด้วย slug (ต้องมีในตาราง DB)
  const bySlug = categories.find(c => c.slug === slug)
  if (bySlug) return bySlug

  // 2) Fallback — ใช้ fallbackLabel
  const rule = CATEGORY_RULES.find(r => r.slug === slug)
  if (!rule) return null
  return categories.find(c => (c.label ?? c.name) === rule.fallbackLabel) ?? null
}
