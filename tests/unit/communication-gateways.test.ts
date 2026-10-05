import { describe, it, expect, vi } from 'vitest'
import { normalizePhoneNumber, sendSmsMessage, getSmsGatewayStatus } from '~/../server/utils/sms-gateway'
import { sendEmailMessage, getEmailGatewayStatus } from '~/../server/utils/email-gateway'

// Mock useRuntimeConfig for test environment
vi.stubGlobal('useRuntimeConfig', () => ({
  smtpHost: '',
  smtpPort: '465',
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  smtpSecure: 'true',
  smsRuApiKey: '',
}))

describe('Communication Gateways (SMS & Email)', () => {
  describe('SMS Gateway', () => {
    it('should correctly normalize various Russian phone number formats', () => {
      expect(normalizePhoneNumber('+7 (900) 123-45-67')).toBe('79001234567')
      expect(normalizePhoneNumber('8 (999) 888-77-66')).toBe('79998887766')
      expect(normalizePhoneNumber('79112223344')).toBe('79112223344')
      expect(normalizePhoneNumber('+7 921 555 44 33')).toBe('79215554433')
    })

    it('should report mock status when no API key configured', () => {
      const status = getSmsGatewayStatus()
      expect(status.provider).toBe('mock')
      expect(status.configured).toBe(false)
    })

    it('should send SMS in mock mode successfully without errors', async () => {
      const res = await sendSmsMessage({
        phone: '+7 (900) 123-45-67',
        text: 'Здравствуйте! Вы приглашены на собеседование.',
      })

      expect(res.success).toBe(true)
      expect(res.provider).toBe('mock')
      expect(res.messageId).toContain('mock-sms-')
      expect(res.deliveredAt).toBeDefined()
    })

    it('should throw error for invalid phone numbers', async () => {
      await expect(sendSmsMessage({
        phone: '123',
        text: 'Привет',
      })).rejects.toThrow('Некорректный номер телефона')
    })
  })

  describe('Email Gateway', () => {
    it('should report mock status when SMTP credentials are not set', () => {
      const status = getEmailGatewayStatus()
      expect(status.provider).toBe('mock')
      expect(status.configured).toBe(false)
    })

    it('should dispatch email in mock mode successfully without throwing', async () => {
      const res = await sendEmailMessage({
        to: 'candidate@example.com',
        subject: 'Приглашение на интервью',
        text: 'Уважаемый соискатель, ждем вас завтра в 14:00.',
      })

      expect(res.success).toBe(true)
      expect(res.provider).toBe('mock')
      expect(res.messageId).toContain('mock-email-')
      expect(res.deliveredAt).toBeDefined()
      expect(res.details).toContain('Mock')
    })
  })
})
