<template lang="pug">
.page-users
  .page-users__header
    h1.page-title Управление пользователями
    
  .page-vacancies__loading(v-if="isLoading")
    .page-candidates__spinner
    | Загрузка...
    
  .page-users__list(v-else)
    .user-card(v-for="u in users", :key="u.id")
      .user-card__left
        .user-card__avatar {{ getInitials(u.full_name) }}
        .user-card__info
          span.user-card__name {{ u.full_name }}
          span.user-card__email {{ u.email }}
      .user-card__right
        .user-card__role {{ roleLabel(u.role) }}
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ROLE_LABELS } from '~/types/user.types'
import type { UserRole, Profile } from '~/types/user.types'

const supabase = useSupabaseClient()
const users = ref<Profile[]>([])
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    users.value = data || []
  } finally {
    isLoading.value = false
  }
})

const getInitials = (name: string) => {
  const parts = name.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0]?.[0]?.toUpperCase() || 'U'
}

const roleLabel = (role: string) => ROLE_LABELS[role as UserRole] || role
</script>

<style lang="scss">
.page-users {
  &__header { margin-bottom: var(--spacing-6); }
  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  
  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
  }
  
  &__info {
    display: flex;
    flex-direction: column;
  }
  
  &__name {
    font-weight: 500;
    font-size: 15px;
  }
  
  &__email {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  
  &__role {
    padding: 4px 12px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 600;
    background-color: rgba(59, 130, 246, 0.1);
    color: var(--color-primary);
  }
}
</style>
