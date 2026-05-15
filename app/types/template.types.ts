export type TemplateType = 'sms' | 'email'
export type TemplateRecipient = 'candidate' | 'director' | 'regional_manager'

export interface Template {
  id: string
  type: TemplateType
  title: string
  body: string
  recipient: TemplateRecipient
  created_at: string
}

export const RECIPIENT_LABELS: Record<TemplateRecipient, string> = {
  candidate: 'Кандидат',
  director: 'Директор',
  regional_manager: 'РМП',
}
