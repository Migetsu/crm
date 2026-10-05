export interface SendSmsOptions {
  phone: string
  text: string
  sender?: string
}

export interface SmsGatewayResult {
  success: boolean
  messageId: string
  provider: 'sms_ru' | 'mock'
  deliveredAt: string
  details?: string
}

export interface SmsGatewayStatus {
  provider: 'sms_ru' | 'mock'
  configured: boolean
}

export const getSmsGatewayStatus = (): SmsGatewayStatus => {
  const config = useRuntimeConfig()
  const isConfigured = Boolean(config.smsRuApiKey && String(config.smsRuApiKey).trim().length > 0)

  return {
    provider: isConfigured ? 'sms_ru' : 'mock',
    configured: isConfigured,
  }
}

export const normalizePhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) {
    return '7' + digits.slice(1)
  }
  return digits
}

interface SmsRuApiResponse {
  status: string
  status_code: number
  status_text?: string
  sms?: Record<string, {
    status: string
    status_code: number
    sms_id?: string
    status_text?: string
  }>
}

export const sendSmsMessage = async (options: SendSmsOptions): Promise<SmsGatewayResult> => {
  const config = useRuntimeConfig()
  const status = getSmsGatewayStatus()
  const phone = normalizePhoneNumber(options.phone)

  if (!phone || phone.length < 10) {
    throw new Error(`Некорректный номер телефона получателя: ${options.phone}`)
  }

  // Real SMS.ru API gateway if API key is provided
  if (status.configured) {
    try {
      const apiKey = String(config.smsRuApiKey).trim()
      const url = new URL('https://sms.ru/sms/send')
      url.searchParams.set('api_id', apiKey)
      url.searchParams.set('to', phone)
      url.searchParams.set('msg', options.text)
      url.searchParams.set('json', '1')

      if (options.sender) {
        url.searchParams.set('from', options.sender)
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`HTTP ошибка SMS-шлюза: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as SmsRuApiResponse

      if (data.status !== 'OK') {
        throw new Error(`Ошибка SMS.ru (${data.status_code}): ${data.status_text || 'Не удалось отправить'}`)
      }

      const phoneResult = data.sms?.[phone]
      const messageId = phoneResult?.sms_id || `smsru-${Date.now()}`

      if (phoneResult && phoneResult.status !== 'OK') {
        throw new Error(`Ошибка доставки на номер ${phone}: ${phoneResult.status_text || 'Сбой'}`)
      }

      return {
        success: true,
        messageId,
        provider: 'sms_ru',
        deliveredAt: new Date().toISOString(),
      }
    } catch (err: unknown) {
      console.error('[SMS.ru Gateway Error]', err)
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка SMS-шлюза'
      throw new Error(`Ошибка отправки SMS (${message})`)
    }
  }

  // Fallback to Mock provider for local development and testing
  const mockId = `mock-sms-${Date.now()}`
  console.info(`[Mock SMS Gateway] Sent to: +${phone} | Text: "${options.text}" | MessageId: ${mockId}`)

  return {
    success: true,
    messageId: mockId,
    provider: 'mock',
    deliveredAt: new Date().toISOString(),
    details: 'Отправлено в тестовом режиме (Mock/Эмуляция). Для реальной отправки укажите SMS_RU_API_KEY в .env.',
  }
}
