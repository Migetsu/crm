export type HistoryEventType = 'status_change' | 'comment' | 'sms' | 'email' | 'edit'

export interface HistoryEvent {
  id: string
  candidate_id: string
  type: HistoryEventType
  title: string
  body: string | null
  created_at: string
  created_by: string | null
  meta: Record<string, unknown> | null
}
