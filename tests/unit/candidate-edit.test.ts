import { describe, it, expect } from 'vitest'
import type { Candidate, CandidateGender, Citizenship, CandidateSource, CandidateAddMethod } from '~/types/candidate.types'

describe('Candidate Edit Validation and Payload Preparation', () => {
  interface EditFormState {
    vacancy_id: string
    last_name: string
    first_name: string
    middle_name: string
    has_no_middle_name: boolean
    birth_date: string
    recommended_by: string
    gender: string
    phone: string
    email: string
    resume_link: string
    address: string
    citizenship: string
    source: string
    add_method: string
  }

  const validateEditForm = (form: EditFormState) => {
    const errors: Record<string, string> = {}
    if (!form.vacancy_id) errors.vacancy_id = 'Выберите вакансию'
    if (!form.last_name.trim()) errors.last_name = 'Введите фамилию'
    if (!form.first_name.trim()) errors.first_name = 'Введите имя'
    if (!form.has_no_middle_name && !form.middle_name.trim()) errors.middle_name = 'Введите отчество'
    if (!form.birth_date) errors.birth_date = 'Укажите дату рождения'
    if (!form.gender) errors.gender = 'Выберите пол'
    if (!form.phone.trim()) errors.phone = 'Введите телефон'
    if (!form.citizenship) errors.citizenship = 'Выберите гражданство'
    if (!form.source) errors.source = 'Выберите источник'
    if (!form.add_method) errors.add_method = 'Выберите способ'
    return errors
  }

  const buildUpdatePayload = (form: EditFormState, finalResumeLink: string | null): Partial<Candidate> => {
    return {
      vacancy_id: form.vacancy_id,
      last_name: form.last_name.trim(),
      first_name: form.first_name.trim(),
      middle_name: form.has_no_middle_name ? null : form.middle_name.trim() || null,
      has_no_middle_name: form.has_no_middle_name,
      birth_date: form.birth_date,
      recommended_by: form.recommended_by.trim() || null,
      gender: form.gender as CandidateGender,
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      resume_link: finalResumeLink,
      address: form.address.trim() || null,
      citizenship: form.citizenship as Citizenship,
      source: form.source as CandidateSource,
      add_method: form.add_method as CandidateAddMethod,
    }
  }

  it('validates required fields correctly', () => {
    const emptyForm: EditFormState = {
      vacancy_id: '',
      last_name: '',
      first_name: '',
      middle_name: '',
      has_no_middle_name: false,
      birth_date: '',
      recommended_by: '',
      gender: '',
      phone: '',
      email: '',
      resume_link: '',
      address: '',
      citizenship: '',
      source: '',
      add_method: '',
    }

    const errors = validateEditForm(emptyForm)
    expect(errors.vacancy_id).toBeTruthy()
    expect(errors.last_name).toBeTruthy()
    expect(errors.first_name).toBeTruthy()
    expect(errors.middle_name).toBeTruthy()
    expect(errors.birth_date).toBeTruthy()
    expect(errors.gender).toBeTruthy()
    expect(errors.phone).toBeTruthy()
    expect(errors.citizenship).toBeTruthy()
  })

  it('allows empty middle_name if has_no_middle_name is true', () => {
    const validFormWithoutMiddleName: EditFormState = {
      vacancy_id: 'v123',
      last_name: 'Смирнов',
      first_name: 'Алексей',
      middle_name: '',
      has_no_middle_name: true,
      birth_date: '1995-04-12',
      recommended_by: '',
      gender: 'male',
      phone: '+7 999 123-45-67',
      email: 'alex@example.com',
      resume_link: '',
      address: 'Москва',
      citizenship: 'rf',
      source: 'hh',
      add_method: 'manual',
    }

    const errors = validateEditForm(validFormWithoutMiddleName)
    expect(errors.middle_name).toBeUndefined()
    expect(Object.keys(errors)).toHaveLength(0)

    const payload = buildUpdatePayload(validFormWithoutMiddleName, null)
    expect(payload.middle_name).toBeNull()
    expect(payload.has_no_middle_name).toBe(true)
    expect(payload.recommended_by).toBeNull()
    expect(payload.last_name).toBe('Смирнов')
  })

  it('formats updated fields diff correctly for audit history', () => {
    const original: Partial<Candidate> = {
      phone: '+7 900 111-22-33',
      address: 'Москва',
    }
    const update: Partial<Candidate> = {
      phone: '+7 900 999-88-77',
      address: 'Москва',
    }

    const changedKeys = (Object.keys(update) as Array<keyof Candidate>).filter(
      key => original[key] !== update[key]
    )

    expect(changedKeys).toContain('phone')
    expect(changedKeys).not.toContain('address')
  })
})
