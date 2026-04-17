# SabaiTax

แอปบันทึกรายรับ-รายจ่าย + คำนวณภาษีเงินได้บุคคลธรรมดา (ประเทศไทย พ.ศ. 2568)
Monorepo ประกอบด้วย Mobile App (React Native / Expo) และ Backend API (Elysia + Bun)

---

## โครงสร้างโปรเจกต์

```
sabaifax/
├── apps/
│   ├── api/          Backend API (Elysia + Bun + Drizzle ORM + Supabase Postgres)
│   └── mobile/       Mobile App (Expo Router + Zustand + NativeWind + Supabase Auth)
├── bun.lock
├── package.json      (workspaces root)
└── CLAUDE.md         คู่มือการทำงานให้ Claude Code
```

---

## Tech Stack

### Mobile (`apps/mobile/`)
- **Expo SDK 54** (bare workflow) + **Expo Router** (file-based navigation)
- **React Native 0.81** + **React 19** + **New Architecture**
- **Zustand** state management
- **NativeWind v4** (Tailwind CSS สำหรับ RN)
- **Supabase Auth** — session เก็บใน `expo-secure-store`
- **ML Kit Text Recognition** — OCR อ่านสลิป/ใบเสร็จ
- **expo-local-authentication** — PIN / Face ID / Touch ID
- **expo-notifications** — Push + Local notification
- **expo-print / expo-sharing** — Export PDF / CSV

### Backend (`apps/api/`)
- **Elysia** (Bun web framework)
- **Drizzle ORM** + **Supabase Postgres** (connection pooler)
- **@elysiajs/cors** + **@elysiajs/swagger** (docs อยู่ที่ `/docs`)
- **Supabase Service Role** — verify JWT + admin lookup

---

## ฟีเจอร์ที่ทำไปแล้ว

- ✅ **Auth** — Login / Register / Forgot Password (Supabase Auth + Username lookup)
- ✅ **Dashboard** — ยอดรวม / Donut pie ภาพรวมรายเดือน + เลือกเดือน / รายการล่าสุด
- ✅ **Wallet** — รายการกระเป๋า, รายละเอียด (กราฟ 7 วัน), สร้างใหม่, โอนระหว่างกระเป๋า
- ✅ **Record** — บันทึกเอง / OCR สแกนสลิป-ใบเสร็จผ่านกล้อง+แกลเลอรี่
- ✅ **History** — ประวัติรายการ + filter ประเภท + เลือกเดือน
- ✅ **Transaction** — รายละเอียด / แก้ไข / ลบ
- ✅ **Tax Simulator** — คำนวณภาษีขั้นบันได 2568 + ค่าลดหย่อน
- ✅ **Settings** — Tax Profile, หมวดหมู่, Budget, การแจ้งเตือน, Security (PIN/Biometric), Export
- ✅ **Onboarding** — Splash + Intro slides
- ✅ **Social Login** — Google / Apple (Supabase OAuth)

---

## การติดตั้ง

### 1. Prerequisites
- **Bun** ≥ 1.3 — https://bun.sh
- **Node.js** ≥ 20 (สำหรับ expo tooling)
- **Android Studio** + Android SDK (สำหรับ build Android)
- **Xcode** (เฉพาะ macOS สำหรับ build iOS)
- **Supabase Project** — https://supabase.com

### 2. Clone + install dependencies

```bash
git clone <repo-url> sabaifax
cd sabaifax
bun install
```

> workspaces รันคำสั่งเดียวครอบทั้ง `apps/api` และ `apps/mobile`

### 3. ตั้งค่า Environment

**`apps/api/.env`**
```
DATABASE_URL=postgresql://postgres.xxx:[password]@aws-0-xxx.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ALLOWED_ORIGINS=                     # ว่าง = ปิด CORS (mobile APK เรียกตรง)
PORT=3000
```

**`apps/mobile/.env`**
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=http://<your-ip>:3000    # dev
# EXPO_PUBLIC_API_URL=https://api.xxx.com    # production
```

### 4. ตั้งค่าฐานข้อมูล

```bash
cd apps/api
bunx drizzle-kit generate    # generate migrations
bunx drizzle-kit push        # push schema → Supabase
```

หรือรัน SQL ใน Supabase SQL Editor ตามไฟล์ `apps/api/drizzle/`

> ต้องเปิด **Row Level Security** ทุก table + policy ให้ user อ่าน/เขียนเฉพาะของตัวเอง

---

## การรัน (Development)

### Backend API

```bash
cd apps/api
bun run index.ts
# → http://localhost:3000
# → Swagger: http://localhost:3000/docs
```

### Mobile App

```bash
cd apps/mobile
bunx expo start             # dev server (ใช้ custom dev client ไม่ใช่ Expo Go)
bunx expo run:android       # build + install APK ลงเครื่อง/emulator
bunx expo run:ios           # เฉพาะ macOS
```

> โปรเจกต์ใช้ **bare workflow** เพราะมี native module (`@react-native-ml-kit/text-recognition`) — **ใช้ Expo Go ไม่ได้**

---

## Build ขึ้น Production

### Mobile → APK / AAB ด้วย EAS

```bash
cd apps/mobile
bun add -g eas-cli
eas login
eas build -p android --profile preview        # .apk สำหรับติดตั้งตรง
eas build -p android --profile production     # .aab สำหรับ Play Store
eas build -p ios --profile production          # iOS
```

> profile ต่างๆ อยู่ใน `eas.json`

### API → Render / Railway / VPS

```bash
cd apps/api
bun run index.ts
```

- Start command: `bun run index.ts`
- Health check path: `/` หรือ `/health`
- ใส่ env vars ตามข้อ 3

---

## โครงสร้าง Routes

### Mobile (Expo Router)
```
app/
├── (auth)/         login · register · forgot-password
└── (app)/
    ├── index.tsx   Dashboard
    ├── wallet/     index · new · [id] · transfer
    ├── record/     index · manual · scanner · review · success
    ├── transaction/[id]
    ├── tax/        Tax Simulator
    ├── history     ประวัติรายการ
    └── settings/   index · tax-profile · categories · budget · notifications · security · export
```

### API
```
GET  /                      health
GET  /auth/lookup           username → email
GET  /profile               PUT /profile
GET  /wallets               POST /wallets        PUT /wallets/:id     DEL /wallets/:id
GET  /categories            POST /categories     DEL /categories/:id
GET  /transactions          POST /transactions   DEL /transactions/:id
GET  /tax/profile           PUT  /tax/profile    POST /tax/calculate
POST /push-tokens           DEL  /push-tokens
POST /notifications/send
```

---

## License

Private — ใช้ภายในโปรเจกต์
