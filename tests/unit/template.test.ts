import { describe, it, expect } from 'vitest'
import { interpolateTemplate, extractTemplateVariables } from '../../app/utils/template'

describe('template interpolation', () => {
  it('correctly replaces single and multiple placeholders', () => {
    const tpl = 'Здравствуйте, {{ФИО}}! Ждём вас на вакансию {{вакансия}}.'
    const result = interpolateTemplate(tpl, {
      'ФИО': 'Иван Иванов',
      'вакансия': 'Кассир',
    })
    expect(result).toBe('Здравствуйте, Иван Иванов! Ждём вас на вакансию Кассир.')
  })

  it('handles spaces inside handlebars {{ variable }}', () => {
    const tpl = 'Собеседование {{ дата }} в {{ время }}'
    const result = interpolateTemplate(tpl, {
      'дата': '10.10.2026',
      'время': '14:00',
    })
    expect(result).toBe('Собеседование 10.10.2026 в 14:00')
  })

  it('leaves missing variables as empty or unreplaced based on fallback', () => {
    const tpl = 'Адрес: {{адрес}}, контакт: {{телефон}}'
    const result = interpolateTemplate(tpl, { 'адрес': 'Ленина 1' })
    expect(result).toBe('Адрес: Ленина 1, контакт: ')
  })

  it('extracts all variable names from template', () => {
    const tpl = 'Здравствуйте, {{ФИО}}! Дата: {{дата}}, время: {{ время }}.'
    const vars = extractTemplateVariables(tpl)
    expect(vars).toEqual(['ФИО', 'дата', 'время'])
  })
})
