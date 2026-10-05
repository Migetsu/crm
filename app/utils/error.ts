interface FetchLikeError {
  data?: {
    statusMessage?: unknown
    message?: unknown
  }
  statusMessage?: unknown
  message?: unknown
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const errObj = error as FetchLikeError
    if (typeof errObj.data?.statusMessage === 'string' && errObj.data.statusMessage.trim()) {
      return errObj.data.statusMessage.trim()
    }
    if (typeof errObj.data?.message === 'string' && errObj.data.message.trim()) {
      return errObj.data.message.trim()
    }
    if (typeof errObj.statusMessage === 'string' && errObj.statusMessage.trim()) {
      return errObj.statusMessage.trim()
    }
    if (typeof errObj.message === 'string' && errObj.message.trim()) {
      return errObj.message.trim()
    }
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error occurred'
}
