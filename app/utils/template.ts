import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export interface TemplateTagInfo {
  tag: string
  description: string
  sample: string
}

export const AVAILABLE_TEMPLATE_TAGS: TemplateTagInfo[] = [
  { tag: '{Имя}', description: 'Имя соискателя', sample: 'Иван' },
  { tag: '{Вакансия}', description: 'Название вакансии', sample: 'Кассир' },
  { tag: '{ДатаИнтервью}', description: 'Дата и время собеседования', sample: '10 октября 2026 в 14:00' },
  { tag: '{АдресИнтервью}', description: 'Адрес проведения собеседования', sample: 'г. Москва, ул. Ленина, д. 10' },
  { tag: '{ТелефонРекрутера}', description: 'Контактный телефон рекрутера', sample: '+7 (900) 123-45-67' },
  { tag: '{ОргЕдиница}', description: 'Филиал или подразделение', sample: 'Пятёрочка №6702, Москва' },
]

export interface TemplateCandidateData {
  first_name?: string | null
  last_name?: string | null
  middle_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}

export interface TemplateContextOptions {
  candidate?: TemplateCandidateData | null
  vacancyTitle?: string | null
  interviewDate?: string | Date | null
  interviewAddress?: string | null
  recruiterPhone?: string | null
  recruiterName?: string | null
  orgUnitName?: string | null
  customVariables?: Record<string, string | number | null | undefined>
}

/**
 * Normalizes input date/time to Russian formatted strings.
 */
export const formatInterviewDateTime = (input?: string | Date | null): { full: string; dateOnly: string; timeOnly: string } => {
  if (!input) {
    return { full: '', dateOnly: '', timeOnly: '' }
  }

  try {
    let dateObj: Date
    if (typeof input === 'string') {
      dateObj = parseISO(input)
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date(input)
      }
    } else {
      dateObj = input
    }

    if (isNaN(dateObj.getTime())) {
      return { full: String(input), dateOnly: String(input), timeOnly: '' }
    }

    const full = format(dateObj, 'd MMMM yyyy в HH:mm', { locale: ru })
    const dateOnly = format(dateObj, 'dd.MM.yyyy', { locale: ru })
    const timeOnly = format(dateObj, 'HH:mm', { locale: ru })

    return { full, dateOnly, timeOnly }
  } catch {
    return { full: String(input), dateOnly: String(input), timeOnly: '' }
  }
}

/**
 * Builds a comprehensive variable dictionary for template interpolation.
 */
export const buildTemplateContext = (options: TemplateContextOptions): Record<string, string> => {
  const candidate = options.candidate
  const firstName = candidate?.first_name?.trim() || ''
  const lastName = candidate?.last_name?.trim() || ''
  const middleName = candidate?.middle_name?.trim() || ''
  const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ') || firstName || 'Кандидат'
  const displayName = firstName || fullName

  const vacancy = options.vacancyTitle?.trim() || ''
  const dt = formatInterviewDateTime(options.interviewDate)
  const address = options.interviewAddress?.trim() || candidate?.address?.trim() || ''
  const recruiterPhone = options.recruiterPhone?.trim() || '+7 (900) 000-00-00'
  const recruiterName = options.recruiterName?.trim() || 'Отдел подбора персонала'
  const orgUnit = options.orgUnitName?.trim() || ''

  const context: Record<string, string> = {
    // Standard variables from requirements
    'Имя': displayName,
    'Вакансия': vacancy,
    'ДатаИнтервью': dt.full || dt.dateOnly,
    'АдресИнтервью': address,
    'ТелефонРекрутера': recruiterPhone,
    'ОргЕдиница': orgUnit,

    // Aliases and lower-case alternatives
    'имя': displayName,
    'ФИО': fullName,
    'ФИО кандидата': fullName,
    'вакансия': vacancy,
    'должность': vacancy,
    'дата_интервью': dt.full || dt.dateOnly,
    'дата': dt.dateOnly || dt.full,
    'время': dt.timeOnly,
    'адрес_интервью': address,
    'адрес': address,
    'телефон_рекрутера': recruiterPhone,
    'телефон': recruiterPhone,
    'рекрутер': recruiterName,
    'орг_единица': orgUnit,
    'орг.единица': orgUnit,
    'филиал': orgUnit,
    'телефон_кандидата': candidate?.phone || '',
    'email_кандидата': candidate?.email || '',
  }

  // Merge any custom variables
  if (options.customVariables) {
    for (const [key, val] of Object.entries(options.customVariables)) {
      if (val !== undefined && val !== null) {
        context[key] = String(val)
      }
    }
  }

  return context
}

/**
 * Normalizes all escaped and literal newlines to standard LF (\n).
 */
export const normalizeTemplateNewlines = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
}

/**
 * Replaces both single {variable} and double {{variable}} placeholders in template string with values from context.
 * Performs case-insensitive matching fallback if exact key is not found.
 */
export const interpolateTemplate = (
  template: string,
  context: Record<string, string | number | null | undefined>,
): string => {
  if (!template) return ''

  const cleanTemplate = normalizeTemplateNewlines(template)

  // Build lowercase lookup map for case-insensitive fallback
  const lowerMap: Record<string, string> = {}
  for (const [k, v] of Object.entries(context)) {
    if (v !== undefined && v !== null) {
      lowerMap[k.toLowerCase()] = String(v)
    }
  }

  return cleanTemplate.replace(/\{{1,2}\s*([\w\u0400-\u04FF._-]+)\s*\}{1,2}/g, (match, key) => {
    // 1. Direct match
    const directVal = context[key]
    if (directVal !== undefined && directVal !== null) {
      return String(directVal)
    }

    // 2. Case-insensitive lookup
    const lowerKey = key.toLowerCase()
    if (lowerMap[lowerKey] !== undefined) {
      return lowerMap[lowerKey]
    }

    // 3. Fallback for common aliases
    if (lowerKey === 'имя' && lowerMap['фио']) return lowerMap['фио']
    if (lowerKey === 'фио' && lowerMap['имя']) return lowerMap['имя']
    if (lowerKey === 'даtainтервью' || lowerKey === 'датаинтервью') {
      return lowerMap['дата'] || ''
    }
    if (lowerKey === 'адресинтервью') {
      return lowerMap['адрес'] || ''
    }
    if (lowerKey === 'телефонрекрутера') {
      return lowerMap['телефон'] || ''
    }

    return ''
  })
}

/**
 * Extracts list of placeholder variable names from template string (supports both {tag} and {{tag}}).
 */
export const extractTemplateVariables = (template: string): string[] => {
  if (!template) return []
  const matches = template.matchAll(/\{{1,2}\s*([\w\u0400-\u04FF._-]+)\s*\}{1,2}/g)
  const set = new Set<string>()
  for (const m of matches) {
    if (m[1]) {
      set.add(m[1])
    }
  }
  return Array.from(set)
}
