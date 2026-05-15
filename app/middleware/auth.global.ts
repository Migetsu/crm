export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const authStore = useAuthStore()
  
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
})
