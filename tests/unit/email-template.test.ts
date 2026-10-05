import { describe, it, expect } from 'vitest'
import { renderBrandedEmailHtml, normalizeNewlines } from '~/../server/utils/email-template'

describe('Branded Email Template & Newline Normalization', () => {
  it('should normalize escaped and Windows-style newlines to clean standard newlines', () => {
    const raw = 'Здравствуйте!\\n\\nПриглашаем на интервью.\\nДата: 10.10.2026\\n\\nС уважением.'
    const normalized = normalizeNewlines(raw)

    expect(normalized).not.toContain('\\n')
    expect(normalized).toContain('\n\n')
    expect(normalized.split('\n').length).toBe(6)
  })

  it('should generate branded corporate HTML email without raw escaped newlines', () => {
    const subject = 'Приглашение на собеседование'
    const text = `Здравствуйте, Иван!\\n\\nПриглашаем вас на вакансию «Кассир».\\n\\nДата: 06.10.2026\\nВремя: 14:00\\nАдрес: г. Москва, ул. Ленина, 10\\n\\nПри себе иметь паспорт.`

    const html = renderBrandedEmailHtml({
      subject,
      text,
      recipientEmail: 'ivan@example.com',
    })

    // Check basic HTML structure
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('Рекрут')
    expect(html).toContain('Про')
    expect(html).toContain(subject)

    // Check that metadata block is styled with corporate container
    expect(html).toContain('06.10.2026')
    expect(html).toContain('14:00')
    expect(html).toContain('г. Москва, ул. Ленина, 10')
    expect(html).toContain('152-ФЗ')

    // Crucial: no raw \n literals in HTML output
    expect(html).not.toContain('\\n')
  })
})
