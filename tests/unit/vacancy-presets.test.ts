import { describe, it, expect } from 'vitest'
import { VACANCY_PRESETS, findVacancyPresetById, isAllowedVacancyTitle } from '~/data/vacancy-presets'

describe('vacancy-presets', () => {
  it('contains exactly 6 pre-configured retail vacancies requested by user', () => {
    expect(VACANCY_PRESETS).toHaveLength(6)

    const expectedTitles = [
      'Продавец-кассир',
      'Пекарь',
      'Сборщик заказов',
      'Администратор магазина',
      'Заместитель директора магазина',
      'Директор магазина',
    ]

    const actualTitles = VACANCY_PRESETS.map(p => p.title)
    expect(actualTitles).toEqual(expectedTitles)
  })

  it('validates each preset has non-empty description, requirements and responsibilities', () => {
    for (const preset of VACANCY_PRESETS) {
      expect(preset.id).toBeTruthy()
      expect(preset.title.trim().length).toBeGreaterThan(0)
      expect(preset.description.trim().length).toBeGreaterThan(20)
      expect(preset.requirements.trim().length).toBeGreaterThan(20)
      expect(preset.responsibilities.trim().length).toBeGreaterThan(20)
    }
  })

  it('correctly finds preset by id', () => {
    const cashier = findVacancyPresetById('cashier')
    expect(cashier).toBeDefined()
    expect(cashier?.title).toBe('Продавец-кассир')

    const baker = findVacancyPresetById('baker')
    expect(baker?.title).toBe('Пекарь')

    const picker = findVacancyPresetById('picker')
    expect(picker?.title).toBe('Сборщик заказов')

    const admin = findVacancyPresetById('store-admin')
    expect(admin?.title).toBe('Администратор магазина')

    const deputy = findVacancyPresetById('deputy-director')
    expect(deputy?.title).toBe('Заместитель директора магазина')

    const director = findVacancyPresetById('store-director')
    expect(director?.title).toBe('Директор магазина')

    const notFound = findVacancyPresetById('unknown-id')
    expect(notFound).toBeUndefined()
  })

  it('allows only the 6 preset titles', () => {
    expect(isAllowedVacancyTitle(' пекарь ')).toBe(true)
    expect(isAllowedVacancyTitle('Директор магазина')).toBe(true)
    expect(isAllowedVacancyTitle('Мерчендайзер')).toBe(false)
    expect(isAllowedVacancyTitle('')).toBe(false)
  })
})
