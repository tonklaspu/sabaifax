-- ============================================================
-- Seed default categories with slug + keywords (Epic 2)
-- Idempotent — ปลอดภัยถ้ารันซ้ำ
-- Match default categories (user_id IS NULL) จาก apps/mobile/src/store/category.store.ts
-- ============================================================

-- ── รายจ่าย (expense) ─────────────────────────────────────
UPDATE categories SET
  slug = 'food',
  keywords = ARRAY[
    '7-eleven','7eleven','seven','เซเว่น','cp all','ซีพี',
    'lotus','โลตัส','big c','บิ๊กซี','tesco','makro','แม็คโคร',
    'tops','villa','foodland','gourmet',
    'foodpanda','grabfood','lineman','robinhood',
    'mcdonald','kfc','burger','pizza','mk','shabu','sukiya',
    'อาหาร','ร้านอาหาร','ข้าว','ก๋วยเตี๋ยว',
    'cafe','คาเฟ่','coffee','กาแฟ','starbucks','amazon coffee'
  ]
WHERE name = 'อาหาร' AND user_id IS NULL AND type = 'expense';

UPDATE categories SET
  slug = 'transport',
  keywords = ARRAY[
    'ptt','ปตท','bangchak','บางจาก','shell','เชลล์',
    'esso','caltex','pt station',
    'bts','mrt','srt','arl','รถไฟ','รถเมล์','ขสมก',
    'grab','bolt','lineman taxi','taxi','แท็กซี่',
    'น้ำมัน','เติมน้ำมัน','ทางด่วน','easy pass','mpass'
  ]
WHERE name = 'เดินทาง' AND user_id IS NULL AND type = 'expense';

UPDATE categories SET
  slug = 'shopping',
  keywords = ARRAY[
    'shopee','lazada','tiktok shop',
    'central','เซ็นทรัล','the mall','siam paragon','emporium',
    'robinson','โรบินสัน','terminal 21','icon siam',
    'uniqlo','zara','h&m','muji','gu','decathlon'
  ]
WHERE name = 'ช้อปปิ้ง' AND user_id IS NULL AND type = 'expense';

UPDATE categories SET
  slug = 'health',
  keywords = ARRAY[
    'โรงพยาบาล','hospital','clinic','คลินิก',
    'watsons','วัตสัน','boots','บู๊ทส์',
    'pharmacy','ร้านยา','เภสัช',
    'bumrungrad','samitivej','bangkok hospital','vejthani'
  ]
WHERE name = 'สุขภาพ' AND user_id IS NULL AND type = 'expense';

UPDATE categories SET
  slug = 'entertainment',
  keywords = ARRAY[
    'major','sf cinema','เมเจอร์','โรงหนัง','หนัง',
    'bowling','karaoke','คาราโอเกะ',
    'netflix','disney+','youtube premium'
  ]
WHERE name = 'บันเทิง' AND user_id IS NULL AND type = 'expense';

UPDATE categories SET
  slug = 'housing',
  keywords = NULL
WHERE name = 'ที่พัก' AND user_id IS NULL AND type = 'expense';

UPDATE categories SET
  slug = 'utility',
  keywords = ARRAY[
    'มิเตอร์','electricity','กฟภ','กฟน','mea','pea',
    'ค่าไฟ','การไฟฟ้า',
    'water','ประปา','ค่าน้ำ','mwa','pwa',
    'true','ทรู','ais','เอไอเอส','dtac','ดีแทค','nt',
    'internet','3bb','netflix','spotify','youtube premium','disney'
  ]
WHERE name = 'ค่าน้ำ/ไฟ' AND user_id IS NULL AND type = 'expense';

UPDATE categories SET
  slug = 'other',
  keywords = NULL
WHERE name = 'อื่น ๆ' AND user_id IS NULL AND type = 'expense';

-- ── รายรับ (income) ───────────────────────────────────────
UPDATE categories SET slug = 'salary',    keywords = NULL
  WHERE name = 'เงินเดือน' AND user_id IS NULL AND type = 'income';

UPDATE categories SET slug = 'freelance', keywords = NULL
  WHERE name = 'ฟรีแลนซ์'  AND user_id IS NULL AND type = 'income';

UPDATE categories SET slug = 'invest',    keywords = NULL
  WHERE name = 'ลงทุน'     AND user_id IS NULL AND type = 'income';

UPDATE categories SET slug = 'bonus',     keywords = NULL
  WHERE name = 'โบนัส'     AND user_id IS NULL AND type = 'income';

UPDATE categories SET slug = 'other',     keywords = NULL
  WHERE name = 'อื่น ๆ'    AND user_id IS NULL AND type = 'income';

-- ── โอน (transfer) ────────────────────────────────────────
UPDATE categories SET slug = 'transfer', keywords = NULL
  WHERE name = 'โอนเงิน'   AND user_id IS NULL AND type = 'transfer';

UPDATE categories SET slug = 'debt',     keywords = NULL
  WHERE name = 'ชำระหนี้'  AND user_id IS NULL AND type = 'transfer';

-- ── ตรวจผล ────────────────────────────────────────────────
-- SELECT id, name, type, slug, array_length(keywords, 1) AS kw_count
-- FROM categories
-- WHERE user_id IS NULL
-- ORDER BY type, name;
