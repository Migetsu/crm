<template lang="pug">
.page-profile
  .page-profile__header
    h1.page-title Настройки профиля
    
  .page-profile__content(v-if="authStore.profile")
    .profile-section
      h3.profile-section__title Личные данные
      .profile-section__grid
        UiInput(v-model="formData.full_name", label="ФИО", placeholder="Введите ваше имя")
        UiInput(:modelValue="authStore.user?.email", label="Email", disabled)
        
    .profile-section
      h3.profile-section__title Оформление
      .profile-section__description Выберите тему оформления приложения. Настройки будут сохранены в вашем профиле.
      .theme-switcher
        button.theme-option(
          :class="{ 'theme-option--active': formData.theme === 'light' }",
          @click="formData.theme = 'light'"
        )
          .theme-option__preview.theme-option__preview--light
            .theme-option__preview-circle
          span Светлая
        button.theme-option(
          :class="{ 'theme-option--active': formData.theme === 'dark' }",
          @click="formData.theme = 'dark'"
        )
          .theme-option__preview.theme-option__preview--dark
            .theme-option__preview-circle
          span Тёмная

    .page-profile__footer
      UiButton(variant="primary", @click="saveProfile", :disabled="isSaving || !isChanged")
        | {{ isSaving ? 'Сохранение...' : 'Сохранить изменения' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useAuthStore } from '~/stores/auth.store'

const authStore = useAuthStore()
const isSaving = ref(false)

const formData = reactive({
  full_name: authStore.profile?.full_name || '',
  theme: authStore.profile?.theme || 'light'
})

// Sync form data if profile loads late
watch(() => authStore.profile, (newProfile) => {
  if (newProfile) {
    formData.full_name = newProfile.full_name
    formData.theme = newProfile.theme
  }
}, { immediate: true })

const isChanged = computed(() => {
  return formData.full_name !== authStore.profile?.full_name || 
         formData.theme !== authStore.profile?.theme
})

const saveProfile = async () => {
  if (!isChanged.value) return
  
  isSaving.value = true
  try {
    await authStore.updateProfile({
      full_name: formData.full_name,
      theme: formData.theme
    })
  } catch (e) {
    console.error(e)
  } finally {
    isSaving.value = false
  }
}
</script>

<style lang="scss">
.page-profile {
  max-width: 800px;
  margin: 0 auto;
  
  &__header {
    margin-bottom: var(--spacing-8);
  }
  
  &__content {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  
  &__footer {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
  }
}

.profile-section {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  
  &__title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: var(--color-text-primary);
  }
  
  &__description {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin-bottom: 20px;
  }
  
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
}

.theme-switcher {
  display: flex;
  gap: 16px;
}

.theme-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: var(--color-bg-body);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  
  &__preview {
    width: 100%;
    height: 60px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    
    &--light {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      &::after {
        content: '';
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        bottom: 10px;
        background-color: #ffffff;
        border-radius: 4px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      }
    }
    
    &--dark {
      background-color: #0f172a;
      border: 1px solid #334155;
      &::after {
        content: '';
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        bottom: 10px;
        background-color: #1e293b;
        border-radius: 4px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
      }
    }
    
    &-circle {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: var(--color-primary);
      position: relative;
      z-index: 10;
    }
  }
  
  span {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  
  &:hover {
    border-color: var(--color-primary-light);
  }
  
  &--active {
    border-color: var(--color-primary);
    background-color: rgba(59, 130, 246, 0.05);
    
    span {
      color: var(--color-primary);
    }
  }
}
</style>
