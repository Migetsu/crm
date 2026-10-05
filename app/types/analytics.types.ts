import type { CandidateSource } from './candidate.types'

export type AnalyticsPeriod = 'all' | '7d' | '30d' | '90d' | 'year'

export interface FunnelStage {
  id: 'new' | 'screening' | 'interview' | 'offer' | 'hired'
  label: string
  count: number
  conversionTotal: number // % of total starting candidates
  conversionStep: number // % of previous stage
  color: string
}

export interface SourceMetric {
  source: CandidateSource | string
  label: string
  total: number
  share: number // % of total pool
  interviews: number
  hired: number
  conversionToHire: number // % hired from this source
}

export interface TimeToHireMetrics {
  avgDaysToHire: number
  minDaysToHire: number
  maxDaysToHire: number
  avgDaysToInterview: number
  hiredCount: number
}

export interface RejectionMetric {
  reason: string
  label: string
  count: number
  share: number
}

export interface AnalyticsFilter {
  period: AnalyticsPeriod
  vacancyId: string
  orgUnitId: string
  source: string
}

export interface AnalyticsSummary {
  totalCandidates: number
  hiredCount: number
  overallConversion: number
  funnel: FunnelStage[]
  sources: SourceMetric[]
  timeToHire: TimeToHireMetrics
  rejections: RejectionMetric[]
}
