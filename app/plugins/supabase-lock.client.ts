export default defineNuxtPlugin(() => {
  // Prevent benign Supabase Web Locks API concurrency errors in browser console during dev/reload
  if (import.meta.client && typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      const msg = event?.reason?.message || ''
      const name = event?.reason?.name || ''
      if (
        msg.includes('Acquiring an exclusive Navigator LockManager lock') ||
        name === 'NavigatorLockAcquireTimeoutError'
      ) {
        event.preventDefault()
      }
    })
  }
})
