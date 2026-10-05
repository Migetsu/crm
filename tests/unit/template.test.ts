import { describe, it, expect } from 'vitest'
import {
  interpolateTemplate,
  extractTemplateVariables,
  buildTemplateContext,
  formatInterviewDateTime,
} from '../../app/utils/template'

describe('template interpolation', () => {
  it('correctly replaces single and multiple placeholders with double braces', () => {
    const tpl = 'Здравствуйте, {{ФИО}}! Ждём вас на вакансию {{вакансия}}.'
    const result = interpolateTemplate(tpl, {
      'ФИО': 'Иван Иванов',
      'вакансия': 'Кассир',
    })
    expect(result).toBe('Здравствуйте, Иван Иванов! Ждём вас на вакансию Кассир.')
  })

  it('correctly replaces placeholders with single braces {Имя}, {Вакансия}, {ДатаИнтервью}', () => {
    const tpl = 'Здравствуйте, {Имя}! Вы записаны на вакансию {Вакансия}. Время: {ДатаИнтервью}, адрес: {АдресИнтервью}. Телефон: {ТелефонРекрутера}.'
    const context = {
      'Имя': 'Алексей',
      'Вакансия': 'Продавец-консультант',
      'ДатаИнтервью': '10 октября в 14:00',
      'АдресИнтервью': 'ул. Тверская, д. 5',
      'ТелефонРекрутера': '+7 900 111-22-33',
    }
    const result = interpolateTemplate(tpl, context)
    expect(result).toBe('Здравствуйте, Алексей! Вы записаны на вакансию Продавец-консультант. Время: 10 октября в 14:00, адрес: ул. Тверская, д. 5. Телефон: +7 900 111-22-33.')
  })

  it('handles spaces inside handlebars {{ variable }} and { variable }', () => {
    const tpl = 'Собеседование {{ дата }} в { время }'
    const result = interpolateTemplate(tpl, {
      'дата': '10.10.2026',
      'время': '14:00',
    })
    expect(result).toBe('Собеседование 10.10.2026 в 14:00')
  })

  it('performs case-insensitive fallback resolution', () => {
    const tpl = 'Привет, {имя}! Вакансия: {ВАКАНСИЯ}.'
    const result = interpolateTemplate(tpl, {
      'Имя': 'Ольга',
      'вакансия': 'Менеджер',
    })
    expect(result).toBe('Привет, Ольга! Вакансия: Менеджер.')
  })

  it('leaves missing variables as empty based on fallback', () => {
    const tpl = 'Адрес: {адрес}, контакт: {телефон}'
    const result = interpolateTemplate(tpl, { 'адрес': 'Ленина 1' })
    expect(result).toBe('Адрес: Ленина 1, контакт: ')
  })

  it('extracts all variable names from template for both single and double braces', () => {
    const tpl = 'Здравствуйте, {Имя}! Дата: {{дата}}, время: { время }, телефон: {{ТелефонРекрутера}}.'
    const vars = extractTemplateVariables(tpl)
    expect(vars).toEqual(['Имя', 'дата', 'время', 'ТелефонРекрутера'])
  })
})

describe('buildTemplateContext', () => {
  it('builds comprehensive context from candidate, vacancy and interview options', () => {
    const ctx = buildTemplateContext({
      candidate: {
        first_name: 'Иван',
        last_name: 'Петров',
        phone: '+7 999 123-45-67',
        email: 'ivan@example.com',
        address: 'г. Москва',
      },
      vacancyTitle: 'Старший кассир',
      interviewDate: '2026-10-15T15:00:00',
      interviewAddress: 'г. Москва, ул. Ленина, 10',
      recruiterPhone: '+7 900 555-55-55',
      orgUnitName: 'Пятёрочка №6702',
    })

    expect(ctx['Имя']).toBe('Иван')
    expect(ctx['ФИО']).toBe('Петров Иван')
    expect(ctx['Вакансия']).toBe('Старший кассир')
    expect(ctx['АдресИнтервью']).toBe('г. Москва, ул. Ленина, 10')
    expect(ctx['ТелефонРекрутера']).toBe('+7 900 555-55-55')
    expect(ctx['ОргЕдиница']).toBe('Пятёрочка №6702')
    expect(ctx['время']).toBe('15:00')
  })

  it('formats interview date correctly', () => {
    const { full, dateOnly, timeOnly } = formatInterviewDateTime('2026-05-20T11:30:00')
    expect(full).toContain('20 мая 2026')
    expect(full).toContain('11:30')
    expect(dateOnly).toBe('20.05.2026')
    expect(timeOnly).toBe('11:30')
  })
})
