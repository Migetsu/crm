export type CandidateStatus =
  | 'new'
  | 'no_feedback'
  | 'rejected'
  | 'self_rejected'
  | 'reserve'
  | 'interview_scheduled'

export type CandidateSource = 'hh' | 'avito'
export type CandidateAddMethod = 'manual' | 'response'
export type CandidateGender = 'male' | 'female'

export type CandidateSortOption =
  | 'created_at_desc'
  | 'created_at_asc'
  | 'name_asc'
  | 'name_desc'
  | 'status_asc'

export interface CandidateFilterParams {
  searchQuery?: string
  vacancyId?: string | null
  status?: CandidateStatus | 'all' | null
  source?: CandidateSource | 'all' | null
  datePeriod?: 'all' | 'today' | 'week' | 'month'
  sortBy?: CandidateSortOption
  page?: number
  pageSize?: number
}

export interface CandidateListResponse {
  items: Candidate[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export type Citizenship =
  | 'ru' | 'by' | 'az' | 'am' | 'kz' | 'kg'
  | 'tj' | 'ua' | 'uz' | 'tm' | 'md' | 'ge'
  | 'lv' | 'lt' | 'ee' | 'bg' | 'other'

export type NoFeedbackReason =
  | 'no_answer_1' | 'no_answer_2' | 'no_answer_3' | 'no_answer_4'
  | 'busy_call_back'

export type RejectedReason =
  | 'four_no_answers'
  | 'not_suitable_experience'
  | 'not_suitable_age'
  | 'not_suitable_location'
  | 'bad_impression'
  | 'already_employed'
  | 'salary_mismatch'
  | 'schedule_mismatch'
  | 'other'

export type SelfRejectedReason =
  | 'found_job'
  | 'changed_mind'
  | 'personal_reasons'
  | 'schedule_not_suitable'
  | 'location_not_suitable'
  | 'salary_not_suitable'
  | 'other'

export type ReserveReason =
  | 'needs_time_to_think'
  | 'temporary_unavailable'
  | 'waiting_for_response'
  | 'family_circumstances'
  | 'other'

export interface Candidate {
  id: string
  vacancy_id: string | null
  last_name: string
  first_name: string
  middle_name: string | null
  has_no_middle_name: boolean
  birth_date: string
  recommended_by: string | null
  gender: CandidateGender
  phone: string
  email: string | null
  resume_link: string | null
  address: string | null
  citizenship: Citizenship
  source: CandidateSource
  add_method: CandidateAddMethod
  status: CandidateStatus
  tags: string[]
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface CandidateCreatePayload {
  vacancy_id: string
  last_name: string
  first_name: string
  middle_name?: string | null
  has_no_middle_name: boolean
  birth_date: string
  recommended_by?: string | null
  gender: CandidateGender
  phone: string
  email?: string | null
  resume_link?: string | null
  address?: string | null
  citizenship: Citizenship
  source: CandidateSource
  add_method: CandidateAddMethod
  tags?: string[]
  created_by?: string
}

export const STATUS_LABELS: Record<CandidateStatus, string> = {
  new: 'Новый',
  no_feedback: 'Нет обратной связи',
  rejected: 'Отклонён',
  self_rejected: 'Самоотказ',
  reserve: 'Резерв',
  interview_scheduled: 'Назначено интервью',
}

export const STATUS_COLORS: Record<CandidateStatus, string> = {
  new: '#3b82f6',
  no_feedback: '#f59e0b',
  rejected: '#ef4444',
  self_rejected: '#f97316',
  reserve: '#8b5cf6',
  interview_scheduled: '#22c55e',
}

export const CITIZENSHIP_LABELS: Record<Citizenship, string> = {
  ru: 'РФ',
  by: 'Беларусь',
  az: 'Азербайджан',
  am: 'Армения',
  kz: 'Казахстан',
  kg: 'Кыргызстан',
  tj: 'Таджикистан',
  ua: 'Украина',
  uz: 'Узбекистан',
  tm: 'Туркменистан',
  md: 'Молдова',
  ge: 'Грузия',
  lv: 'Латвия',
  lt: 'Литва',
  ee: 'Эстония',
  bg: 'Болгария',
  other: 'Другое',
}

export const GENDER_LABELS: Record<CandidateGender, string> = {
  male: 'Мужской',
  female: 'Женский',
}

export const SOURCE_LABELS: Record<CandidateSource, string> = {
  hh: 'HH.ru',
  avito: 'Авито',
}

export const ADD_METHOD_LABELS: Record<CandidateAddMethod, string> = {
  manual: 'Вручную',
  response: 'Отклик',
}

/** Allowed status transitions */
export const STATUS_TRANSITIONS: Record<CandidateStatus, CandidateStatus[]> = {
  new: ['no_feedback', 'rejected', 'self_rejected', 'reserve', 'interview_scheduled'],
  no_feedback: ['new', 'rejected', 'self_rejected', 'reserve', 'interview_scheduled'],
  rejected: ['new'],
  self_rejected: ['new'],
  reserve: ['new', 'rejected', 'self_rejected', 'interview_scheduled'],
  interview_scheduled: ['new', 'rejected', 'self_rejected', 'reserve'],
}

export const NO_FEEDBACK_LABELS: Record<NoFeedbackReason, string> = {
  no_answer_1: 'Недозвон 1',
  no_answer_2: 'Недозвон 2',
  no_answer_3: 'Недозвон 3',
  no_answer_4: 'Недозвон 4',
  busy_call_back: 'Занят, перезвонить',
}

export const REJECTED_LABELS: Record<RejectedReason, string> = {
  four_no_answers: '4 недозвона',
  not_suitable_experience: 'Не подходит по опыту',
  not_suitable_age: 'Не подходит по возрасту',
  not_suitable_location: 'Не подходит по локации',
  bad_impression: 'Плохое впечатление на звонке',
  already_employed: 'Уже трудоустроен',
  salary_mismatch: 'Не устраивает зарплата',
  schedule_mismatch: 'Не устраивает график',
  other: 'Другое',
}

export const SELF_REJECTED_LABELS: Record<SelfRejectedReason, string> = {
  found_job: 'Нашёл работу',
  changed_mind: 'Передумал',
  personal_reasons: 'Личные обстоятельства',
  schedule_not_suitable: 'Не устраивает график',
  location_not_suitable: 'Далеко от дома',
  salary_not_suitable: 'Не устраивает зарплата',
  other: 'Другое',
}

export const RESERVE_LABELS: Record<ReserveReason, string> = {
  needs_time_to_think: 'Нужно время подумать',
  temporary_unavailable: 'Временно недоступен',
  waiting_for_response: 'Ожидает решения по другому офферу',
  family_circumstances: 'Семейные обстоятельства',
  other: 'Другое',
}
