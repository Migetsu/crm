export type HistoryEventType =
  | 'status_change'
  | 'comment'
  | 'sms'
  | 'email'
  | 'call'
  | 'attachment'
  | 'consent'
  | 'edit'

export interface HistoryAuthor {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
}

export interface HistoryEventMeta {
  from_status?: string | null
  to_status?: string | null
  reason?: string | null
  next_contact_date?: string | null
  interview_address?: string | null
  interview_date?: string | null
  call_result?: 'connected' | 'no_answer' | 'busy' | 'wrong_number' | 'other' | null
  template_id?: string | null
  recipient?: string | null
  phone?: string | null
  email?: string | null
  file_name?: string | null
  file_url?: string | null
  file_size?: number | null
  consent_granted?: boolean | null
  consent_method?: string | null
  [key: string]: unknown
}

export interface HistoryEvent {
  id: string
  candidate_id: string
  type: HistoryEventType
  title: string
  body: string | null
  created_at: string
  created_by: string | null
  meta: HistoryEventMeta | null
  author?: HistoryAuthor | null
}
