export interface RenderEmailOptions {
  subject: string
  text: string
  candidateName?: string
  recipientEmail?: string
}

/**
 * Normalizes all escaped and literal newlines to standard LF (\n).
 */
export const normalizeNewlines = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
}

/**
 * Converts plain text into clean, styled HTML paragraphs,
 * highlighting metadata blocks (dates, addresses) with corporate styling.
 */
export const renderBrandedEmailHtml = (options: RenderEmailOptions): string => {
  const cleanSubject = options.subject.trim()
  const cleanText = normalizeNewlines(options.text.trim())

  // Split into paragraphs by double newlines or single newlines
  const paragraphs = cleanText
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)

  const contentHtml = paragraphs.map(p => {
    // If paragraph contains key-value metadata like "Дата:", "Адрес:", "Время:"
    const lines = p.split('\n').map(l => l.trim()).filter(Boolean)
    const hasMetadata = lines.some(l => /^(Дата|Время|Адрес|Вакансия|Телефон):/i.test(l))

    if (hasMetadata) {
      const rowsHtml = lines.map(line => {
        const match = line.match(/^([^:]+):\s*(.+)$/)
        if (match) {
          const label = match[1].trim()
          const val = match[2].trim()
          return `
            <div style="display: flex; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px;">
              <span style="color: #64748b; width: 100px; flex-shrink: 0; font-weight: 500;">${label}:</span>
              <strong style="color: #0f172a;">${val || '—'}</strong>
            </div>
          `
        }
        return `<div style="padding: 4px 0; font-size: 14px; color: #334155;">${line}</div>`
      }).join('')

      return `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
          ${rowsHtml}
        </div>
      `
    }

    // Regular paragraph
    const formattedText = p.replace(/\n/g, '<br/>')
    return `<p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #334155;">${formattedText}</p>`
  }).join('')

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px 18px 32px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                      Рекрут<span style="color: #3b82f6;">Про</span>
                    </span>
                    <span style="font-size: 12px; color: #64748b; margin-left: 8px; font-weight: 500;">• Отдел подбора персонала</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #3b82f6; background-color: #eff6ff; padding: 4px 10px; border-radius: 9999px;">
                      CRM
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Subject Heading -->
          <tr>
            <td style="padding: 24px 32px 12px 32px;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.4;">
                ${cleanSubject}
              </h1>
            </td>
          </tr>

          <!-- Message Content -->
          <tr>
            <td style="padding: 10px 32px 24px 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 12px; color: #64748b; line-height: 1.5;">
                    Это письмо сформировано автоматически сервисом подбора персонала <strong>РекрутПро CRM</strong>.<br/>
                    Пожалуйста, не отвечайте на это письмо, если в тексте не указаны иные контакты.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 12px; font-size: 11px; color: #94a3b8;">
                    Соблюдение 152-ФЗ «О персональных данных» • Все права защищены
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
