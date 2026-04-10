// // apps/api/src/index.ts
// import { Elysia } from 'elysia'
// import { cors } from '@elysiajs/cors'
// import { swagger } from '@elysiajs/swagger'
// import { authRoute } from './routes/auth.route'
// import { transactionRoute } from './routes/transaction.route'
// import { taxRoute } from './routes/tax.route'

// const app = new Elysia()
//   .use(cors())
//   .use(swagger({ path: '/docs' }))
//   .use(authRoute)
//   .use(transactionRoute)
//   .use(taxRoute)
//   .listen(3000)

// console.log(`🦊 SabaiTax API running at ${app.server?.hostname}:${app.server?.port}`)