import { Elysia, t } from 'elysia'
import { db } from '../db/client'
import { pushTokens } from '../db/schema'
import { eq } from 'drizzle-orm'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

// Send push notifications via Expo Push API
async function sendExpoPush(messages: {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
}[]) {
  if (messages.length === 0) return []

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(messages),
  })

  const json = await res.json() as { data: unknown[] }
  return json.data
}

export const notificationRoute = new Elysia({ prefix: '/notifications' })

  // POST /notifications/send — send push to a specific user (or self for testing)
  .post('/send', async ({ userId, body }) => {
    const targetUserId = body.targetUserId ?? userId

    const tokens = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, targetUserId))

    if (tokens.length === 0) {
      return { sent: 0, message: 'No push tokens found' }
    }

    const messages = tokens.map(({ token }) => ({
      to: token,
      title: body.title,
      body: body.body,
      data: body.data,
    }))

    const results = await sendExpoPush(messages)
    return { sent: results.length, results }
  }, {
    body: t.Object({
      targetUserId: t.Optional(t.String()),
      title:        t.String(),
      body:         t.String(),
      data:         t.Optional(t.Any()),
    })
  })
