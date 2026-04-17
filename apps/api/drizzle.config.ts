import { defineConfig } from 'drizzle-kit'

// drizzle-kit ใช้ Session pooler (5432) หรือ direct URL — ไม่ใช่ transaction pooler (6543)
// ตั้ง DIRECT_URL ใน .env ถ้าอยากแยกจาก DATABASE_URL ของ runtime
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL!

export default defineConfig({
  schema:  './src/db/schema/index.ts',
  out:     './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
})