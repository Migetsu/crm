import { getSupabaseAdminClient } from '../../utils/supabase-admin'
import { sendEmailMessage } from '../../utils/email-gateway'
import { renderBrandedEmailHtml, normalizeNewlines } from '../../utils/email-template'

interface SendEmailBody {
  candidateId: string
  to: string
  subject: string
  text: string
  html?: string
  templateId?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SendEmailBody>(event)

  if (!body?.candidateId || !body?.to || !body?.subject || !body?.text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Обязательные поля: candidateId, to, subject, text',
    })
  }

  const adminClient = getSupabaseAdminClient()

  // 1. Authorize caller via Bearer token
  let callerId: string | null = null
  const authHeader = getHeader(event, 'authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim()
    const { data: authUser } = await adminClient.auth.getUser(token)
    callerId = authUser.user?.id || null
  }

  // 2. Normalize text and generate branded corporate HTML template
  const cleanSubject = body.subject.trim()
  const cleanText = normalizeNewlines(body.text.trim())
  const brandedHtml = body.html || renderBrandedEmailHtml({
    subject: cleanSubject,
    text: cleanText,
    recipientEmail: body.to.trim(),
  })

  // 3. Dispatch through email gateway
  const result = await sendEmailMessage({
    to: body.to.trim(),
    subject: cleanSubject,
    text: cleanText,
    html: brandedHtml,
  })

  // 3. Record interaction in candidate history
  const providerLabel = result.provider === 'smtp' ? 'SMTP' : 'Тест (Mock)'
  const historyTitle = `Email: «${body.subject.trim()}» [${providerLabel}]`

  const { error: historyError } = await adminClient
    .from('candidate_history')
    .insert({
      candidate_id: body.candidateId,
      type: 'email',
      title: historyTitle,
      body: body.text.trim(),
      created_by: callerId,
      meta: {
        recipient: body.to.trim(),
        subject: body.subject.trim(),
        template_id: body.templateId || null,
        provider: result.provider,
        message_id: result.messageId,
        delivered_at: result.deliveredAt,
      },
    })

  if (historyError) {
    console.error('Failed to log email in candidate_history:', historyError)
  }

  return {
    success: true,
    messageId: result.messageId,
    provider: result.provider,
    deliveredAt: result.deliveredAt,
    details: result.details,
  }
})
