<template lang="pug">
header.app-header
  .app-header__left
    //- Хлебные крошки или заголовок можно добавить позже
  
  .app-header__right
    button.app-header__theme-toggle(@click="authStore.toggleTheme", title="Переключить тему")
      component(:is="authStore.profile?.theme === 'dark' ? Sun : Moon", :size="20")
      
    NuxtLink.app-header__user(v-if="authStore.profile", to="/profile")
      .app-header__user-avatar {{ userInitials }}
      .app-header__user-info
        span.app-header__user-name {{ authStore.profile.full_name }}
        span.app-header__user-role {{ userRoleFormatted }}
         
    button.app-header__logout(@click="handleLogout", title="Выйти")
      LogOut(:size="20")
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth.store'
import { Sun, Moon, LogOut } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const userInitials = computed(() => {
  if (!authStore.profile?.full_name) return 'U'
  const parts = authStore.profile.full_name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return parts[0][0].toUpperCase()
})

const userRoleFormatted = computed(() => {
  const roles: Record<string, string> = {
    'superadmin': 'Супер Админ',
    'admin': 'Администратор',
    'operator_director': 'Директор',
    'operator': 'Оператор'
  }
  return roles[authStore.profile?.role || ''] || authStore.profile?.role
})
</script>

<style lang="scss">
@use './AppHeader.scss';
</style>
