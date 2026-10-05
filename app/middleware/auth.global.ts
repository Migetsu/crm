export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const authStore = useAuthStore()
  
  if (to.path.startsWith('/api/')) return

  if (!user.value && to.path !== '/login' && to.path !== '/register') {
    return navigateTo('/login')
  }
  
  if (user.value && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/')
  }

  // Fetch profile if not loaded
  if (user.value && !authStore.profile) {
    await authStore.fetchProfile()
  }

  const role = authStore.profile?.role || 'operator'

  // Admin routes: only admin and superadmin
  if (to.path.startsWith('/admin') && !['admin', 'superadmin'].includes(role)) {
    return navigateTo('/')
  }

  // Vacancies and Org Units: operator_director, admin, superadmin only
  if ((to.path.startsWith('/vacancies') || to.path.startsWith('/org-units')) && role === 'operator') {
    return navigateTo('/')
  }
})
