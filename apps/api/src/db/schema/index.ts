import {
  pgTable, uuid, text, numeric, boolean,
  timestamp, pgEnum, integer,
} from 'drizzle-orm/pg-core'

// ── Enums ──────────────────────────────────────────

export const transactionTypeEnum = pgEnum('transaction_type', [
  'expense', 'income', 'transfer',
])

export const walletTypeEnum = pgEnum('wallet_type', [
  'cash', 'bank', 'credit', 'savings', 'investment', 'other',
])

export const planEnum = pgEnum('plan', [
  'free', 'premium',
])

// ── Tables ─────────────────────────────────────────

// Users (ต่อจาก Supabase Auth)
export const profiles = pgTable('profiles', {
  id:        uuid('id').primaryKey(),           // ← ตรงกับ auth.users.id
  username:  text('username').unique(),          // สำหรับ login แทนอีเมล
  firstName: text('first_name'),                 // ชื่อจริง — ใช้กับ Tax Simulator / e-Receipt
  lastName:  text('last_name'),                  // นามสกุล
  fullName:  text('full_name'),                  // legacy — จะ derive จาก firstName + lastName
  plan:      planEnum('plan').default('free'),
  planExpiresAt: timestamp('plan_expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Wallets
export const wallets = pgTable('wallets', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull(),
  name:      text('name').notNull(),
  type:      walletTypeEnum('type').default('cash'),
  balance:   numeric('balance', { precision: 12, scale: 2 }).default('0'),
  icon:      text('icon').default('💰'),
  color:     text('color').default('#00C896'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Categories
export const categories = pgTable('categories', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id'),                   // null = default category
  name:      text('name').notNull(),
  icon:      text('icon').default('📦'),
  type:      transactionTypeEnum('type').notNull(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

// Transactions
export const transactions = pgTable('transactions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull(),
  walletId:    uuid('wallet_id'),
  toWalletId:  uuid('to_wallet_id'),            // สำหรับ transfer
  categoryId:  uuid('category_id'),
  type:        transactionTypeEnum('type').notNull(),
  amount:      numeric('amount', { precision: 12, scale: 2 }).notNull(),
  note:        text('note'),
  date:        timestamp('date').defaultNow(),
  isTaxDeductible: boolean('is_tax_deductible').default(false),
  receiptUrl:  text('receipt_url'),             // รูปใบเสร็จจาก OCR
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
})

// Push Tokens
export const pushTokens = pgTable('push_tokens', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull(),
  token:     text('token').notNull(),
  platform:  text('platform'),                     // 'ios' | 'android'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Budgets
export const budgets = pgTable('budgets', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').notNull().unique(),
  monthlyLimit: numeric('monthly_limit', { precision: 12, scale: 2 }).default('0'),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow(),
})

// Tax Profiles
export const taxProfiles = pgTable('tax_profiles', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().unique(),
  // ── ข้อมูลสำหรับจับคู่ใบกำกับภาษี / e-Tax Invoice ──
  nationalId:      text('national_id'),                  // เลขบัตร 13 หลัก
  address:         text('address'),                      // ที่อยู่ตามบัตร ปชช.
  // ── ข้อมูลคำนวณภาษี ──
  grossIncome:     numeric('gross_income', { precision: 12, scale: 2 }).default('0'),
  maritalStatus:   text('marital_status').default('single'),
  childCount:      integer('child_count').default(0),
  incomeType:      text('income_type').default('employment'),
  lifeInsurance:   numeric('life_insurance', { precision: 12, scale: 2 }).default('0'),
  healthInsurance: numeric('health_insurance', { precision: 12, scale: 2 }).default('0'),
  socialSecurity:  numeric('social_security', { precision: 12, scale: 2 }).default('9000'),
  ssf:             numeric('ssf', { precision: 12, scale: 2 }).default('0'),
  rmf:             numeric('rmf', { precision: 12, scale: 2 }).default('0'),
  updatedAt:       timestamp('updated_at').defaultNow(),
})