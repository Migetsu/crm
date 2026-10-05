import type { Candidate } from '~/types/candidate.types'
import type { HistoryEvent } from '~/types/history.types'
import type { Vacancy } from '~/types/vacancy.types'
import type { OrgUnit } from '~/types/org-unit.types'
import type {
  AnalyticsFilter,
  AnalyticsSummary,
  FunnelStage,
  SourceMetric,
  TimeToHireMetrics,
  RejectionMetric,
} from '~/types/analytics.types'
import { STATUS_LABELS, SOURCE_LABELS, REJECTED_LABELS, SELF_REJECTED_LABELS, NO_FEEDBACK_LABELS } from '~/types/candidate.types'

/**
 * Filter candidates according to selected analytics filters
 */
export const filterCandidatesForAnalytics = (
  candidates: Candidate[],
  vacancies: Vacancy[],
  filter: AnalyticsFilter
): Candidate[] => {
  const now = new Date().getTime()

  // Build mapping from vacancyId to orgUnitId
  const vacancyOrgUnitMap = new Map<string, string>()
  for (const v of vacancies) {
    if (v.org_unit_id) {
      vacancyOrgUnitMap.set(v.id, v.org_unit_id)
    }
  }

  return candidates.filter(candidate => {
    // 1. Period filter
    if (filter.period !== 'all') {
      const createdTime = new Date(candidate.created_at).getTime()
      const diffDays = (now - createdTime) / (1000 * 60 * 60 * 24)

      if (filter.period === '7d' && diffDays > 7) return false
      if (filter.period === '30d' && diffDays > 30) return false
      if (filter.period === '90d' && diffDays > 90) return false
      if (filter.period === 'year' && diffDays > 365) return false
    }

    // 2. Vacancy filter
    if (filter.vacancyId && candidate.vacancy_id !== filter.vacancyId) {
      return false
    }

    // 3. Org Unit filter
    if (filter.orgUnitId) {
      const unitId = candidate.vacancy_id ? vacancyOrgUnitMap.get(candidate.vacancy_id) : null
      if (unitId !== filter.orgUnitId) {
        return false
      }
    }

    // 4. Source filter
    if (filter.source && candidate.source !== filter.source) {
      return false
    }

    return true
  })
}

/**
 * Check if candidate reached interview stage
 */
export const hasReachedInterview = (c: Candidate, historyEvents: HistoryEvent[] = []): boolean => {
  if (['interview_scheduled', 'interview_done', 'offer_pending', 'offer_accepted'].includes(c.status)) {
    return true
  }
  return historyEvents.some(
    h => h.candidate_id === c.id && (h.type === 'interview' || (h.meta && h.meta.to_status === 'interview_scheduled'))
  )
}

/**
 * Check if candidate reached offer stage
 */
export const hasReachedOffer = (c: Candidate, historyEvents: HistoryEvent[] = []): boolean => {
  if (['offer_pending', 'offer_accepted'].includes(c.status)) {
    return true
  }
  return historyEvents.some(
    h => h.candidate_id === c.id && (h.meta && (h.meta.to_status === 'offer_pending' || h.meta.to_status === 'offer_accepted'))
  )
}

/**
 * Check if candidate was hired
 */
export const isCandidateHired = (c: Candidate): boolean => {
  return c.status === 'offer_accepted'
}

/**
 * Calculate recruitment funnel stages and conversion rates
 */
export const calculateFunnel = (
  candidates: Candidate[],
  historyEvents: HistoryEvent[] = []
): FunnelStage[] => {
  const total = candidates.length

  const screeningCount = candidates.filter(c => {
    // Reached screening if not new or has active communication
    return c.status !== 'new'
  }).length

  const interviewCount = candidates.filter(c => hasReachedInterview(c, historyEvents)).length
  const offerCount = candidates.filter(c => hasReachedOffer(c, historyEvents)).length
  const hiredCount = candidates.filter(c => isCandidateHired(c)).length

  const safeStepConversion = (current: number, prev: number): number => {
    if (prev <= 0) return 0
    return Math.round((current / prev) * 100)
  }

  const safeTotalConversion = (current: number): number => {
    if (total <= 0) return 0
    return Math.round((current / total) * 100)
  }

  return [
    {
      id: 'new',
      label: 'Новые заявки',
      count: total,
      conversionTotal: 100,
      conversionStep: 100,
      color: '#3b82f6',
    },
    {
      id: 'screening',
      label: 'В обработке / Скрининг',
      count: screeningCount,
      conversionTotal: safeTotalConversion(screeningCount),
      conversionStep: safeStepConversion(screeningCount, total),
      color: '#f59e0b',
    },
    {
      id: 'interview',
      label: 'Собеседование',
      count: interviewCount,
      conversionTotal: safeTotalConversion(interviewCount),
      conversionStep: safeStepConversion(interviewCount, screeningCount),
      color: '#8b5cf6',
    },
    {
      id: 'offer',
      label: 'Оффер выставлен',
      count: offerCount,
      conversionTotal: safeTotalConversion(offerCount),
      conversionStep: safeStepConversion(offerCount, interviewCount),
      color: '#06b6d4',
    },
    {
      id: 'hired',
      label: 'Принят / Нанят',
      count: hiredCount,
      conversionTotal: safeTotalConversion(hiredCount),
      conversionStep: safeStepConversion(hiredCount, offerCount),
      color: '#22c55e',
    },
  ]
}

/**
 * Calculate performance metrics grouped by candidate source
 */
export const calculateSourceMetrics = (
  candidates: Candidate[],
  historyEvents: HistoryEvent[] = []
): SourceMetric[] => {
  const totalPool = candidates.length
  const sourceGroups = new Map<string, Candidate[]>()

  for (const c of candidates) {
    const src = c.source || 'other'
    if (!sourceGroups.has(src)) {
      sourceGroups.set(src, [])
    }
    sourceGroups.get(src)!.push(c)
  }

  const metrics: SourceMetric[] = []

  sourceGroups.forEach((items, source) => {
    const count = items.length
    const interviews = items.filter(c => hasReachedInterview(c, historyEvents)).length
    const hired = items.filter(c => isCandidateHired(c)).length

    metrics.push({
      source,
      label: (SOURCE_LABELS as Record<string, string>)[source] || source.toUpperCase(),
      total: count,
      share: totalPool > 0 ? Math.round((count / totalPool) * 100) : 0,
      interviews,
      hired,
      conversionToHire: count > 0 ? Math.round((hired / count) * 100) : 0,
    })
  })

  // Sort by total volume descending
  return metrics.sort((a, b) => b.total - a.total)
}

/**
 * Calculate Time-to-Hire and Time-to-Interview in days
 */
export const calculateTimeToHire = (
  candidates: Candidate[],
  historyEvents: HistoryEvent[] = []
): TimeToHireMetrics => {
  const hireDays: number[] = []
  const interviewDays: number[] = []

  // Create lookup for events by candidate
  const candidateHistoryMap = new Map<string, HistoryEvent[]>()
  for (const h of historyEvents) {
    if (!candidateHistoryMap.has(h.candidate_id)) {
      candidateHistoryMap.set(h.candidate_id, [])
    }
    candidateHistoryMap.get(h.candidate_id)!.push(h)
  }

  for (const c of candidates) {
    const createdDate = new Date(c.created_at).getTime()
    const events = candidateHistoryMap.get(c.id) || []

    // Time to interview
    const interviewEvent = events.find(
      e => e.type === 'interview' || (e.meta && e.meta.to_status === 'interview_scheduled')
    )
    if (interviewEvent) {
      const intDate = new Date(interviewEvent.created_at).getTime()
      const days = Math.max(0, Math.round((intDate - createdDate) / (1000 * 60 * 60 * 24)))
      interviewDays.push(days)
    }

    // Time to hire
    if (isCandidateHired(c)) {
      const hireEvent = events.find(
        e => e.meta && (e.meta.to_status === 'offer_accepted' || e.meta.status === 'offer_accepted')
      )
      const hireDate = hireEvent ? new Date(hireEvent.created_at).getTime() : new Date(c.updated_at).getTime()
      const days = Math.max(0, Math.round((hireDate - createdDate) / (1000 * 60 * 60 * 24)))
      hireDays.push(days)
    }
  }

  const avg = (arr: number[]) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0)

  return {
    avgDaysToHire: avg(hireDays),
    minDaysToHire: hireDays.length ? Math.min(...hireDays) : 0,
    maxDaysToHire: hireDays.length ? Math.max(...hireDays) : 0,
    avgDaysToInterview: avg(interviewDays),
    hiredCount: hireDays.length,
  }
}

/**
 * Calculate rejection breakdown
 */
export const calculateRejectionStats = (
  candidates: Candidate[],
  historyEvents: HistoryEvent[] = []
): RejectionMetric[] => {
  const rejectedCandidates = candidates.filter(c =>
    ['rejected', 'self_rejected', 'no_feedback'].includes(c.status)
  )
  const totalRejections = rejectedCandidates.length
  if (totalRejections === 0) return []

  const reasonCounts = new Map<string, number>()

  for (const c of rejectedCandidates) {
    // Check history for specific reason
    const historyItem = historyEvents.find(
      h => h.candidate_id === c.id && h.meta && h.meta.reason
    )
    const rawReason = (historyItem?.meta?.reason as string) || c.status

    reasonCounts.set(rawReason, (reasonCounts.get(rawReason) || 0) + 1)
  }

  const allLabels: Record<string, string> = {
    ...STATUS_LABELS,
    ...REJECTED_LABELS,
    ...SELF_REJECTED_LABELS,
    ...NO_FEEDBACK_LABELS,
  }

  const metrics: RejectionMetric[] = []
  reasonCounts.forEach((count, reason) => {
    metrics.push({
      reason,
      label: allLabels[reason] || reason,
      count,
      share: Math.round((count / totalRejections) * 100),
    })
  })

  return metrics.sort((a, b) => b.count - a.count)
}

/**
 * Format CSV rows and trigger instant file download in browser with UTF-8 BOM
 */
export const buildCsvString = (rows: (string | number)[][], headers: string[]): string => {
  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerLine = headers.map(escapeCell).join(';')
  const bodyLines = rows.map(row => row.map(escapeCell).join(';'))

  // Prepend UTF-8 BOM so Excel opens Cyrillic text natively
  return '\uFEFF' + [headerLine, ...bodyLines].join('\r\n')
}

/**
 * Triggers file download in client browser
 */
export const triggerCsvDownload = (csvContent: string, filename: string): void => {
  if (typeof window === 'undefined') return
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate CSV export of candidate database
 */
export const generateCandidatesCsv = (
  candidates: Candidate[],
  vacancies: Vacancy[] = [],
  orgUnits: OrgUnit[] = []
): string => {
  const vacancyMap = new Map<string, Vacancy>()
  for (const v of vacancies) vacancyMap.set(v.id, v)

  const orgUnitMap = new Map<string, OrgUnit>()
  for (const u of orgUnits) orgUnitMap.set(u.id, u)

  const headers = [
    'ID',
    'Фамилия',
    'Имя',
    'Отчество',
    'Телефон',
    'Email',
    'Вакансия',
    'Подразделение / Филиал',
    'Источник',
    'Способ добавления',
    'Текущий статус',
    'Дата добавления',
  ]

  const rows = candidates.map(c => {
    const vacancy = c.vacancy_id ? vacancyMap.get(c.vacancy_id) : null
    const orgUnit = vacancy?.org_unit_id ? orgUnitMap.get(vacancy.org_unit_id) : null
    const sourceLabel = (SOURCE_LABELS as Record<string, string>)[c.source] || c.source
    const statusLabel = STATUS_LABELS[c.status] || c.status

    return [
      c.id,
      c.last_name,
      c.first_name,
      c.middle_name || '',
      c.phone,
      c.email || '',
      vacancy?.title || 'Не прикреплена',
      orgUnit?.name || vacancy?.org_unit_name || 'Не прикреплен',
      sourceLabel,
      c.add_method === 'manual' ? 'Вручную' : 'Отклик',
      statusLabel,
      new Date(c.created_at).toLocaleDateString('ru-RU'),
    ]
  })

  return buildCsvString(rows, headers)
}

/**
 * Generate CSV summary report containing Funnel, Sources and Time-to-Hire
 */
export const generateFunnelReportCsv = (summary: AnalyticsSummary, filterPeriodLabel: string): string => {
  const lines: string[] = []

  // Section 1: General Info
  lines.push(`Отчёт по воронке подбора и эффективности найма;Период: ${filterPeriodLabel}`)
  lines.push(`Всего кандидатов в выборке;${summary.totalCandidates}`)
  lines.push(`Принято офферов (нанято);${summary.hiredCount}`)
  lines.push(`Итоговая конверсия в наём;${summary.overallConversion}%`)
  lines.push(`Средняя скорость найма;${summary.timeToHire.avgDaysToHire} дней`)
  lines.push(`Среднее время до интервью;${summary.timeToHire.avgDaysToInterview} дней`)
  lines.push('')

  // Section 2: Funnel
  lines.push('ЭТАПЫ ВОРОНКИ ПОДБОРА;Количество кандидатов;Конверсия от общего объёма (%);Конверсия шага (%)')
  for (const f of summary.funnel) {
    lines.push(`${f.label};${f.count};${f.conversionTotal}%;${f.conversionStep}%`)
  }
  lines.push('')

  // Section 3: Sources
  lines.push('ИСТОЧНИКИ КАНДИДАТОВ;Всего кандидатов;Доля в общем объёме (%);Дошли до интервью;Принято офферов;Конверсия источника в наём (%)')
  for (const s of summary.sources) {
    lines.push(`${s.label};${s.total};${s.share}%;${s.interviews};${s.hired};${s.conversionToHire}%`)
  }
  lines.push('')

  // Section 4: Rejections
  if (summary.rejections.length > 0) {
    lines.push('АНАЛИЗ ОТКАЗОВ;Причина отказа / статус;Количество;Доля от всех отказов (%)')
    for (const r of summary.rejections) {
      lines.push(`${r.label};${r.count};${r.share}%`)
    }
  }

  return '\uFEFF' + lines.join('\r\n')
}
