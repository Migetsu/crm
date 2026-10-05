import { describe, it, expect } from 'vitest'
import { VACANCY_PRESETS, findVacancyPresetById } from '~/data/vacancy-presets'

describe('Org Unit Vacancies & Presets Integration', () => {
  it('should have all 6 retail presets available for each store', () => {
    expect(VACANCY_PRESETS).toHaveLength(6)
    const presetTitles = VACANCY_PRESETS.map(p => p.title)
    expect(presetTitles).toContain('Продавец-кассир')
    expect(presetTitles).toContain('Пекарь')
    expect(presetTitles).toContain('Сборщик заказов')
    expect(presetTitles).toContain('Администратор магазина')
    expect(presetTitles).toContain('Заместитель директора магазина')
    expect(presetTitles).toContain('Директор магазина')
  })

  it('should find preset by id with all required retail fields', () => {
    const cashier = findVacancyPresetById('cashier')
    expect(cashier).toBeDefined()
    expect(cashier?.title).toBe('Продавец-кассир')
    expect(cashier?.requirements).toContain('медицинской книжки')
    expect(cashier?.responsibilities).toContain('кассовом узле')
  })

  it('should correctly calculate open vacancies and candidate count', () => {
    const mockVacancies = [
      { id: '1', title: 'Пекарь', is_open: true, status_counts: { total: 3 } },
      { id: '2', title: 'Продавец-кассир', is_open: false, status_counts: { total: 0 } },
      { id: '3', title: 'Сборщик заказов', is_open: true, status_counts: { total: 5 } },
    ]

    const openCount = mockVacancies.filter(v => v.is_open).length
    const totalCandidates = mockVacancies.reduce((acc, v) => acc + (v.status_counts?.total || 0), 0)

    expect(openCount).toBe(2)
    expect(totalCandidates).toBe(8)
  })

  it('should find vacancy for preset and calculate open branches correctly', () => {
    const mockStoreVacancies = [
      { id: '1', title: 'Продавец-кассир', org_unit_id: 'unit-1', is_open: true },
      { id: '2', title: 'Кассир', org_unit_id: 'unit-2', is_open: false },
      { id: '3', title: 'Пекарь', org_unit_id: 'unit-1', is_open: true },
    ]

    const cashierPreset = findVacancyPresetById('cashier')!
    const unit1Cashier = mockStoreVacancies.find(
      v => v.org_unit_id === 'unit-1' && (v.title.includes('кассир') || v.title.includes('Кассир'))
    )
    const unit2Cashier = mockStoreVacancies.find(
      v => v.org_unit_id === 'unit-2' && (v.title.includes('кассир') || v.title.includes('Кассир'))
    )

    expect(cashierPreset).toBeDefined()
    expect(unit1Cashier?.is_open).toBe(true)
    expect(unit2Cashier?.is_open).toBe(false)
  })
})
