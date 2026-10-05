import type { CandidateStatus } from '~/types/candidate.types'
import type { CandidateStatusCounts } from '~/types/vacancy.types'

/**
 * Calculates aggregated candidate counts for vacancy funnel cards and details.
 */
export const calculateVacancyStats = (candidates: Array<{ status: CandidateStatus | string }>): CandidateStatusCounts => {
  const counts: CandidateStatusCounts = {
    total: candidates.length,
    new: 0,
    interview: 0,
    accepted: 0,
    rejected: 0,
    reserve: 0,
  }

  for (const c of candidates) {
    if (c.status === 'new') {
      counts.new++
    } else if (c.status === 'interview_scheduled' || c.status === 'interview_done') {
      counts.interview++
    } else if (c.status === 'offer_accepted') {
      counts.accepted++
    } else if (c.status === 'reserve') {
      counts.reserve++
    } else if (c.status === 'rejected' || c.status === 'self_rejected' || c.status === 'no_feedback') {
      counts.rejected++
    }
  }

  return counts
}
