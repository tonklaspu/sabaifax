import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { supabaseAdmin } from './src/middleware/auth'
import { transactionRoute } from './src/routes/transaction.route'
import { walletRoute } from './src/routes/wallet.route'
import { taxRoute } from './src/routes/tax.route'
import { categoryRoute } from './src/routes/category.route'
import { profileRoute } from './src/routes/profile.route'
import { pushTokenRoute } from './src/routes/push-token.route'
import { notificationRoute } from './src/routes/notification.route'
import { budgetRoute } from './src/routes/budget.route'
import { authRoute } from './src/routes/auth.route'

// Mobile app (APK) เรียก API โดยตรง ไม่ต้องใช้ CORS preflight
// Web origin ที่อนุญาตให้อ่านจาก env — ไม่ตั้งก็ปิดทั้งหมด
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean)

const app = new Elysia()
  .use(cors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }))
  .use(swagger({ path: '/docs' }))

  // Root / Health check (ไม่ต้อง auth)
  .get('/', () => 'SabaiTax API is running!')
  .get('/health', () => ({ status: 'ok', timestamp: new Date() }))
  .get('/favicon.ico', ({ set }) => {
    set.status = 204
    return ''
  })

  // ── Auth middleware ที่ app level ──
  .derive(async ({ headers }) => {
    const token = headers.authorization?.replace('Bearer ', '')
    if (!token) return { userId: null as string | null }

    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !data.user) return { userId: null as string | null }
      //console.log('✅ Auth:', data.user.id)
      return { userId: data.user.id as string | null }
    } catch {
      return { userId: null as string | null }
    }
  })
  .onBeforeHandle(({ userId, set, path }) => {
    // Skip auth for public routes
    if (path === '/' || path === '/health' || path === '/favicon.ico' || path.startsWith('/docs') || path.startsWith('/auth/')) return
    if (!userId) {
      set.status = 401
      return { message: 'Unauthorized' }
    }
  })

  // Error handler — log เฉพาะ message (ไม่ leak stack / query / credentials) + ตอบ 500 generic
  .onError(({ error, path, code, set }) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`❌ [${code}] ${path}: ${message}`)

    // ปล่อย validation (VALIDATION) และ not-found (NOT_FOUND) ให้ Elysia จัดการตามปกติ
    if (code === 'VALIDATION' || code === 'NOT_FOUND' || code === 'PARSE') return

    set.status = 500
    return { message: 'Internal server error' }
  })

  // Routes
  .use(profileRoute)
  .use(walletRoute)
  .use(categoryRoute)
  .use(transactionRoute)
  .use(taxRoute)
  .use(pushTokenRoute)
  .use(notificationRoute)
  .use(budgetRoute)
  .use(authRoute)

  .listen(3000)

console.log(`🦊 SabaiTax API → http://localhost:${app.server?.port}`)
