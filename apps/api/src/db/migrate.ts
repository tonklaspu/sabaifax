import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env')
  process.exit(1)
}

async function runMigrations() {
  console.log('⏳ Connecting to database...')
  const sql = postgres(connectionString!, { max: 1 })
  const db = drizzle(sql)

  console.log('⏳ Running migrations...')
  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' })
    console.log('✅ Migrations completed successfully!')
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

runMigrations()
