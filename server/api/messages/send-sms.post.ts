import { getSupabaseAdminClient } from '../../utils/supabase-admin'
import { sendSmsMessage } from '../../utils/sms-gateway'
import { normalizeNewlines } from '../../utils/email-template'

interface SendSmsBody {
  candidateId: string
  phone: string
  text: string
  templateId?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SendSmsBody>(event)

  if (!body?.candidateId || !body?.phone || !body?.text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Обязательные поля: candidateId, phone, text',
    })
  }

  const adminClient = getSupabaseAdminClient()

  // 1. Authorize caller via Bearer token
  let callerId: string | null = null
  const authHeader = getHeader(event, 'authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim()
    try {
      const { data: authUser } = await adminClient.auth.getUser(token)
      const rawId = authUser.user?.id || null
      if (rawId) {
        const { data: prof } = await adminClient.from('profiles').select('id').eq('id', rawId).maybeSingle()
        callerId = prof?.id || null
      }
    } catch {
      callerId = null
    }
  }

  // 2. Dispatch through SMS gateway
  const cleanText = normalizeNewlines(body.text.trim())
  const result = await sendSmsMessage({
    phone: body.phone.trim(),
    text: cleanText,
  })

  // 3. Record interaction in candidate history
  const providerLabel = result.provider === 'sms_ru' ? 'SMS.ru' : 'Тест (Mock)'
  const historyTitle = `SMS кандидату [${providerLabel}]`

  const { error: historyError } = await adminClient
    .from('candidate_history')
    .insert({
      candidate_id: body.candidateId,
      type: 'sms',
      title: historyTitle,
      body: body.text.trim(),
      created_by: callerId,
      meta: {
        recipient: body.phone.trim(),
        template_id: body.templateId || null,
        provider: result.provider,
        message_id: result.messageId,
        delivered_at: result.deliveredAt,
      },
    })

  if (historyError) {
    console.error('Failed to log SMS in candidate_history:', historyError)
  }

  return {
    success: true,
    messageId: result.messageId,
    provider: result.provider,
    deliveredAt: result.deliveredAt,
    details: result.details,
  }
})
