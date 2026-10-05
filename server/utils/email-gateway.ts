import nodemailer from 'nodemailer'

export interface SendEmailOptions {
  to: string
  subject: string
  text: string
  html?: string
  from?: string
}

export interface EmailGatewayResult {
  success: boolean
  messageId: string
  provider: 'smtp' | 'mock'
  deliveredAt: string
  details?: string
}

export interface EmailGatewayStatus {
  provider: 'smtp' | 'mock'
  configured: boolean
  host: string | null
  user: string | null
  from: string | null
}

export const getEmailGatewayStatus = (): EmailGatewayStatus => {
  const config = useRuntimeConfig()
  const isConfigured = Boolean(config.smtpHost && config.smtpUser && config.smtpPass)

  return {
    provider: isConfigured ? 'smtp' : 'mock',
    configured: isConfigured,
    host: config.smtpHost ? String(config.smtpHost) : null,
    user: config.smtpUser ? String(config.smtpUser) : null,
    from: config.smtpFrom ? String(config.smtpFrom) : (config.smtpUser ? String(config.smtpUser) : null),
  }
}

export const sendEmailMessage = async (options: SendEmailOptions): Promise<EmailGatewayResult> => {
  const config = useRuntimeConfig()
  const status = getEmailGatewayStatus()

  // Real SMTP sending if credentials are provided in .env
  if (status.configured) {
    try {
      const port = Number(config.smtpPort) || 465
      const isSecure = config.smtpSecure !== 'false' && port === 465

      const transporter = nodemailer.createTransport({
        host: String(config.smtpHost),
        port,
        secure: isSecure,
        auth: {
          user: String(config.smtpUser),
          pass: String(config.smtpPass),
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      })

      const senderFrom = options.from || status.from || 'noreply@crm.local'

      const info = await transporter.sendMail({
        from: senderFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text.replace(/\n/g, '<br/>'),
      })

      return {
        success: true,
        messageId: info.messageId || `smtp-${Date.now()}`,
        provider: 'smtp',
        deliveredAt: new Date().toISOString(),
      }
    } catch (err: unknown) {
      console.error('[SMTP Gateway Error]', err)
      const message = err instanceof Error ? err.message : 'Ошибка отправки через SMTP-сервер'
      throw new Error(`Не удалось отправить email через SMTP (${message})`)
    }
  }

  // Fallback to Mock/Sandbox provider for development and testing
  const mockId = `mock-email-${Date.now()}`
  console.info(`[Mock Email Gateway] Sent to: ${options.to} | Subject: "${options.subject}" | MessageId: ${mockId}`)

  return {
    success: true,
    messageId: mockId,
    provider: 'mock',
    deliveredAt: new Date().toISOString(),
    details: 'Отправлено в тестовом режиме (Mock/Эмуляция). Для реальной отправки укажите SMTP_HOST, SMTP_USER, SMTP_PASS в .env.',
  }
}
