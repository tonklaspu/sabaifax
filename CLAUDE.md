# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

Monorepo ประกอบด้วย 2 apps

- `apps/api/` — Backend API (Elysia + Bun + Drizzle ORM + PostgreSQL) ✅ Routes พร้อมแล้ว
- `apps/mobile/` — React Native mobile app (Expo Router + Zustand + Supabase)

## Commands

### Mobile (`apps/mobile/`)
```bash
cd apps/mobile
bun install
expo run:android   # bare workflow — ต้องมี Android SDK
expo run:ios       # bare workflow — ต้องมี Xcode
bunx expo start    # dev server (ใช้ custom dev client ไม่ใช่ Expo Go)
```

> โปรเจกต์ใช้ **bare workflow** เพราะติดตั้ง `expo-dev-client` และ `@react-native-ml-kit/text-recognition`

### API (`apps/api/`)
```bash
cd apps/api
bun run index.ts           # Start API server (port 3000)
bunx drizzle-kit generate  # Generate migrations
bunx drizzle-kit push      # Push schema to Supabase
```

## Mobile App Architecture

### Routing (Expo Router — file-based)
```
app/
├── _layout.tsx              ← Root layout + Auth initialize
├── index.tsx                ← Redirect → login
├── (auth)/
│   ├── _layout.tsx          ← Auth guard (ถ้า login อยู่แล้ว → redirect ไป app)
│   ├── login.tsx            ✅ Done
│   ├── register.tsx         ✅ Done
│   └── forgot-password.tsx  ✅ Done
└── (app)/
    ├── _layout.tsx          ← App guard (ถ้าไม่ login → redirect ไป login)
    ├── index.tsx            ✅ Done — Dashboard
    ├── tax/
    │   └── index.tsx        ✅ Done — Tax Simulator
    ├── wallet/              ✅ Done — รายการกระเป๋า
    │   ├── index.tsx        รายการกระเป๋าทั้งหมด + ยอดรวม
    │   ├── new.tsx          สร้างกระเป๋าใหม่
    │   └── [id].tsx         รายละเอียดกระเป๋า + รายการ
    ├── record/              ✅ Done — บันทึกรายการ
    │   ├── index.tsx        เลือกวิธีบันทึก (Manual / Scanner)
    │   ├── manual.tsx       กรอกรายการ (รายจ่าย/รายรับ/โอน)
    │   ├── scanner.tsx      ✅ Done — กล้อง + Gallery → ML Kit OCR → review (NativeWind)
    │   ├── review.tsx       ✅ Done — แสดงรูป + pre-fill จาก OCR + ยืนยัน (NativeWind)
    │   └── success.tsx      ✅ Done — หน้าบันทึกสำเร็จ
    ├── history.tsx          ✅ Done — ประวัติรายการ + filter + เลือกเดือน
    ├── transaction/
    │   └── [id].tsx         ✅ Done — รายละเอียด Transaction + ลบ
    └── settings/
        ├── index.tsx        ✅ Done — หน้าหลักตั้งค่า
        ├── tax-profile.tsx  ✅ Done — ข้อมูลลดหย่อนภาษี
        ├── categories.tsx   ✅ Done — จัดการหมวดหมู่ (CRUD)
        ├── notifications.tsx ✅ Done — ตั้งค่าการแจ้งเตือน (UI)
        ├── security.tsx     ✅ Done — PIN 6 หลัก / Face ID / Touch ID (expo-local-authentication)
        └── export.tsx       ✅ Done — Export PDF / CSV (expo-print + expo-sharing)
```

### State Management (Zustand)
stores อยู่ที่ `apps/mobile/src/store/`
**ทุก Store ยิงผ่าน Elysia API แล้ว (ไม่ยิง Supabase ตรงอีกต่อไป ยกเว้น auth)**

- `auth.store.ts`        ✅ Session + User + Auth initialize — ใช้ Supabase Auth ตรง
- `wallet.store.ts`      ✅ → api.get/post/put/delete('/wallets')
- `transaction.store.ts` ✅ → api.get('/transactions?type=&from=&to=&limit=') + post + delete (URLSearchParams) + `selectedYear/selectedMonth` + `setSelectedMonth(y,m)` auto-refetch สำหรับ Monthly Pie
- `tax.store.ts`         ✅ → api.post('/tax/calculate', { grossIncome, deductions }) — ลบ fetchFromSupabase ออกแล้ว
- `tax-profile.store.ts` ✅ → api.get/put('/tax/profile') + loading state
- `category.store.ts`    ✅ → api.get/post/delete('/categories') + loading state + async CRUD
- `scan.store.ts`        ✅ `pendingImageUri` + `ocrResult` ส่งข้อมูลจาก scanner → review

### Services
อยู่ที่ `apps/mobile/src/services/`

- `supabase.ts`     — Supabase client (session เก็บใน `expo-secure-store`)
- `auth.service.ts` — Auth helpers
- `api.client.ts`   ✅ HTTP client — get/post/put/delete + auto attach Bearer token จาก Supabase session
- `ocr.service.ts`  ✅ ML Kit OCR wrapper — `recognizeReceipt(uri)` → parse ยอดเงิน / วันที่ / isSlip / bank

### OCR Flow
```
scanner.tsx → takePicture / pickFromGallery
    → recognizeReceipt(uri)   [ocr.service.ts]
    → parseSlip(rawText)      [slip-parser.ts]
    → เก็บใน scan.store
    → router.replace('review')
review.tsx → pre-fill จาก ocrResult → createTransaction()
```

### Shared Components
อยู่ที่ `apps/mobile/src/components/`

- `ui/Header.tsx`       — หัวข้อหน้าจอ + ปุ่มย้อนกลับ
- `ui/Button.tsx`       — ปุ่ม primary/secondary/ghost + loading
- `ui/Card.tsx`         — การ์ด dark glass (default/emerald/subtle)
- `ui/Input.tsx`        — TextInput + label
- `ui/BottomNav.tsx`    — แถบ navigation + FAB
- `wallet/BalanceCard.tsx`  — ยอดรวม + รายรับ/จ่าย
- `wallet/WalletCard.tsx`   — การ์ดกระเป๋าเงิน
- `wallet/BarChart.tsx`     — กราฟแท่งรายเดือน (ใช้ในหน้ารายละเอียดกระเป๋า — คำนวณจาก transactions จริง 6 เดือนย้อนหลัง)
- `wallet/MonthlyPie.tsx`   — Donut pie chart (pure-RN, ไม่พึ่ง react-native-svg) โชว์รายรับ vs รายจ่าย + คงเหลือสุทธิ
- `wallet/MonthSelector.tsx` — แถบ scroll แนวนอน 12 เดือนย้อนหลัง (ปี พ.ศ.)
- `transaction/TransactionItem.tsx` — แถวรายการ

### Styling
ใช้ NativeWind v4 (Tailwind CSS) — config อยู่ที่ `tailwind.config.ts` + `global.css` + `metro.config.js`
บางหน้ายังใช้ `StyleSheet.create()` อยู่ (กำลัง migrate)

### Design Tokens
อยู่ที่ `apps/mobile/src/constants/`

- `colors.ts`     — Color tokens (Navy, Emerald, Gold, Error, Info, Purple, Orange)
- `typography.ts` — Font scale (Sarabun + DM Mono) + TextStyles presets
- `spacing.ts`    — Spacing scale (4px base) + Radius + Shadow + Layout
- `index.ts`      — Re-export ทั้งหมด

### Supabase Integration
- Client: `apps/mobile/src/services/supabase.ts`
- Session storage: `expo-secure-store` (ไม่ใช้ AsyncStorage)
- Environment: `apps/mobile/.env`
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_API_URL` ← Elysia API URL

### Utils
- `apps/mobile/src/utils/tax.ts`          — Thai personal income tax calculator 2568
- `apps/mobile/src/utils/validation.ts`   — Zod schemas (login, register)
- `apps/mobile/src/utils/slip-parser.ts`  — Parse OCR text: amount / date / isSlip / bank

## API Architecture (apps/api/)

### Routes
```
GET  /health
GET  /profile          PUT  /profile
GET  /wallets          POST /wallets        PUT /wallets/:id    DEL /wallets/:id
GET  /categories       POST /categories     DEL /categories/:id
GET  /transactions     POST /transactions   DEL /transactions/:id
GET  /tax/profile      PUT  /tax/profile    POST /tax/calculate
POST /push-tokens      DEL  /push-tokens?token=
POST /notifications/send
```

### Database Schema (Supabase PostgreSQL)
```
profiles       — id, username (unique, lowercase), first_name, last_name, full_name (legacy), plan, plan_expires_at
wallets        — id, user_id, name, type, balance, icon, color
categories     — id, user_id (null=default), name, icon, type, is_default
transactions   — id, user_id, wallet_id, to_wallet_id, category_id, type, amount, note, date, is_tax_deductible, receipt_url
push_tokens    — id, user_id, token, platform, created_at, updated_at
tax_profiles   — id, user_id, national_id, address, gross_income, marital_status, child_count, life_insurance, health_insurance, social_security, ssf, rmf
```

### Auth
- Mobile → Supabase Auth → JWT token
- Mobile ส่ง `Authorization: Bearer {token}` ไปกับทุก Request
- Elysia middleware verify token กับ Supabase service_role

### Environment (`apps/api/.env`)
```
DATABASE_URL=postgresql://postgres.xxx:[pass]@pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PORT=3000
```

## Progress Summary

### Frontend
```
✅ Auth Flow        login / register / forgot-password
✅ Dashboard        ยอดรวม / ภาพรวมรายเดือน (Donut pie + month selector) / ลดหย่อนภาษี / รายการล่าสุด
✅ Tax Simulator    คำนวณภาษีขั้นบันได / ค่าลดหย่อน
✅ Wallet           รายการกระเป๋า / รายละเอียด / สร้างใหม่
✅ Record Manual    เลือกวิธีบันทึก / กรอกเอง
✅ History          ประวัติรายการ + filter + เลือกเดือน
✅ Transaction      รายละเอียด + ลบ
✅ Settings         หน้าหลัก / Tax Profile / หมวดหมู่ / แจ้งเตือน / Security / Export
✅ Record OCR       scanner.tsx + review.tsx + success.tsx (ต้อง Build Native เพื่อทดสอบ)
✅ NativeWind       ตั้งค่า Tailwind CSS + Shared Components
```

### Backend
```
✅ Elysia Routes    profile / wallets / categories / transactions / tax / push-tokens / notifications
✅ Database Schema  สร้างผ่าน Supabase SQL Editor แล้ว
✅ RLS Policies     ทุก Table มี Row Level Security
✅ Auth Middleware  verify JWT จาก Supabase
✅ Stores Migration ทุก Store ย้ายมายิงผ่าน Elysia API แล้ว
✅ Drizzle Migrate  bun run db:migrate (programmatic migrator) + schema synced
```

### Completed (ต้อง rebuild)
```
✅ OCR Build        scanner.tsx + review.tsx + success.tsx (ต้อง expo run:android)
✅ Security         expo-local-authentication (Face ID / PIN / SecureStore)
✅ Notifications    expo-notifications — local scheduling + push token + permission
✅ Export           PDF (expo-print) / CSV (expo-file-system + expo-sharing)
✅ Background Slip  expo-background-fetch + expo-media-library + expo-task-manager
```

### TODO — Next Phase
```
✅ Onboarding        Splash Screen (โลโก้ ST) + สไลด์แนะนำแอป 3 หน้า
⏳ NativeWind Migrate หน้าที่ยังใช้ StyleSheet: dashboard, history, tax, settings, manual -->
✅ Push from Server   push_tokens table + POST/DELETE /push-tokens + POST /notifications/send + auto register on login
✅ Wallet Transfer UI ปุ่มโอนเงินใน wallet detail → transfer.tsx + pre-select fromId
✅ Social Login       Google + Apple Sign-In ทั้ง login.tsx + register.tsx (Supabase OAuth)
✅ Edit Transaction   แก้ไขรายการ (ตอนนี้มีแค่ดู+ลบ)
✅ Budget Setting     หน้าตั้งค่า Budget รายเดือน + เชื่อม budget alert
⏳ Theme              รองรับ Light Mode (ตอนนี้ Dark อย่างเดียว)
```
