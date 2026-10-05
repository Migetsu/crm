import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Candidate } from '~/types/candidate.types'
import type { HistoryEvent } from '~/types/history.types'
import type { Vacancy } from '~/types/vacancy.types'
import type { OrgUnit } from '~/types/org-unit.types'
import type { AnalyticsFilter, AnalyticsSummary } from '~/types/analytics.types'
import {
  filterCandidatesForAnalytics,
  calculateFunnel,
  calculateSourceMetrics,
  calculateTimeToHire,
  calculateRejectionStats,
  generateCandidatesCsv,
  generateFunnelReportCsv,
  triggerCsvDownload,
} from '~/utils/analytics'
import { getErrorMessage } from '~/utils/error'

export const useAnalyticsStore = defineStore('analytics', () => {
  const supabase = useSupabaseClient()

  const candidates = ref<Candidate[]>([])
  const historyEvents = ref<HistoryEvent[]>([])
  const vacancies = ref<Vacancy[]>([])
  const orgUnits = ref<OrgUnit[]>([])

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const filter = ref<AnalyticsFilter>({
    period: 'all',
    vacancyId: '',
    orgUnitId: '',
    source: '',
  })

  const fetchAllData = async () => {
    isLoading.value = true
    error.value = null
    try {
      const [candRes, histRes, vacRes, orgRes] = await Promise.all([
        supabase.from('candidates').select('*').order('created_at', { ascending: false }),
        supabase.from('candidate_history').select('*').order('created_at', { ascending: true }),
        supabase.from('vacancies').select('*'),
        supabase.from('org_units').select('*'),
      ])

      if (candRes.error) throw candRes.error
      if (histRes.error) throw histRes.error
      if (vacRes.error) throw vacRes.error
      if (orgRes.error) throw orgRes.error

      candidates.value = (candRes.data as Candidate[]) || []
      historyEvents.value = (histRes.data as HistoryEvent[]) || []
      vacancies.value = (vacRes.data as Vacancy[]) || []
      orgUnits.value = (orgRes.data as OrgUnit[]) || []
    } catch (e: unknown) {
      error.value = getErrorMessage(e)
      console.error('Failed to load analytics data:', e)
    } finally {
      isLoading.value = false
    }
  }

  const filteredCandidates = computed(() => {
    return filterCandidatesForAnalytics(candidates.value, vacancies.value, filter.value)
  })

  const summary = computed<AnalyticsSummary>(() => {
    const list = filteredCandidates.value
    const funnel = calculateFunnel(list, historyEvents.value)
    const sources = calculateSourceMetrics(list, historyEvents.value)
    const timeToHire = calculateTimeToHire(list, historyEvents.value)
    const rejections = calculateRejectionStats(list, historyEvents.value)

    const total = list.length
    const hired = list.filter(c => c.status === 'offer_accepted').length
    const overallConversion = total > 0 ? Math.round((hired / total) * 100) : 0

    return {
      totalCandidates: total,
      hiredCount: hired,
      overallConversion,
      funnel,
      sources,
      timeToHire,
      rejections,
    }
  })

  const getPeriodLabel = computed(() => {
    switch (filter.value.period) {
      case '7d': return 'Последние 7 дней'
      case '30d': return 'Последние 30 дней'
      case '90d': return 'Последние 90 дней (квартал)'
      case 'year': return 'Последний год'
      default: return 'Всё время'
    }
  })

  const exportCandidates = () => {
    const csv = generateCandidatesCsv(filteredCandidates.value, vacancies.value, orgUnits.value)
    const dateStr = new Date().toISOString().slice(0, 10)
    triggerCsvDownload(csv, `candidates_export_${dateStr}.csv`)
  }

  const exportFunnelReport = () => {
    const csv = generateFunnelReportCsv(summary.value, getPeriodLabel.value)
    const dateStr = new Date().toISOString().slice(0, 10)
    triggerCsvDownload(csv, `recruitment_funnel_report_${dateStr}.csv`)
  }

  return {
    candidates,
    vacancies,
    orgUnits,
    isLoading,
    error,
    filter,
    fetchAllData,
    filteredCandidates,
    summary,
    getPeriodLabel,
    exportCandidates,
    exportFunnelReport,
  }
})
