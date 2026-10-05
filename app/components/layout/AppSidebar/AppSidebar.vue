<template lang="pug">
aside.app-sidebar(:class="{ 'app-sidebar--collapsed': isCollapsed }")
  .app-sidebar__header
    .app-sidebar__logo
      .app-sidebar__logo-icon
      span.app-sidebar__logo-text(v-if="!isCollapsed") РекрутПро
    button.app-sidebar__toggle(@click="toggleCollapse")
      component(:is="isCollapsed ? ChevronRight : ChevronLeft", :size="18")
  
  .app-sidebar__search(v-if="!isCollapsed")
    .app-sidebar__search-input-wrapper
      Search.app-sidebar__search-icon(:size="16")
      input.app-sidebar__search-input(
        type="text",
        v-model="searchQuery",
        placeholder="Поиск по меню..."
      )
      
  .app-sidebar__nav
    // Основное
    UiAccordion(
      v-if="shouldShowGroup('main')",
      title="Основное",
      :initiallyOpen="true",
      :isCollapsed="isCollapsed"
    )
      NuxtLink.app-sidebar__link(to="/", active-class="app-sidebar__link--active", v-if="filteredMenuContains('Витрина кандидатов')")
        Users(:size="18")
        span.app-sidebar__link-text(v-if="!isCollapsed") Витрина кандидатов
        
      NuxtLink.app-sidebar__link(to="/vacancies", active-class="app-sidebar__link--active", v-if="filteredMenuContains('Вакансии')")
        Briefcase(:size="18")
        span.app-sidebar__link-text(v-if="!isCollapsed") Вакансии
        
      NuxtLink.app-sidebar__link(to="/org-units", active-class="app-sidebar__link--active", v-if="filteredMenuContains('Орг единицы')")
        MapPin(:size="18")
        span.app-sidebar__link-text(v-if="!isCollapsed") Орг единицы
        
    // Моя компания
    UiAccordion(
      v-if="shouldShowGroup('company')",
      title="Моя компания",
      :initiallyOpen="true",
      :isCollapsed="isCollapsed"
    )
      NuxtLink.app-sidebar__link(to="/company", active-class="app-sidebar__link--active", v-if="filteredMenuContains('Информация')")
        FileText(:size="18")
        span.app-sidebar__link-text(v-if="!isCollapsed") Информация
        
    // Шаблоны
    UiAccordion(
      v-if="shouldShowGroup('templates')",
      title="Шаблоны",
      :initiallyOpen="true",
      :isCollapsed="isCollapsed"
    )
      NuxtLink.app-sidebar__link(to="/templates/sms", active-class="app-sidebar__link--active", v-if="filteredMenuContains('Шаблоны SMS')")
        Mail(:size="18")
        span.app-sidebar__link-text(v-if="!isCollapsed") Шаблоны SMS
        
      NuxtLink.app-sidebar__link(to="/templates/email", active-class="app-sidebar__link--active", v-if="filteredMenuContains('Шаблоны Email')")
        Mail(:size="18")
        span.app-sidebar__link-text(v-if="!isCollapsed") Шаблоны Email
        
    // Администрирование
    UiAccordion(
      v-if="shouldShowGroup('admin')",
      title="Администрирование",
      :initiallyOpen="true",
      :isCollapsed="isCollapsed"
    )
      NuxtLink.app-sidebar__link(to="/admin/users", active-class="app-sidebar__link--active", v-if="filteredMenuContains('Управление пользователями')")
        Settings(:size="18")
        span.app-sidebar__link-text(v-if="!isCollapsed") Управление пользователями
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useAuthStore } from '~/stores/auth.store'
import { 
  Users, Briefcase, MapPin, Search, ChevronLeft, ChevronRight, 
  FileText, Mail, Settings 
} from 'lucide-vue-next'
import UiAccordion from '~/components/ui/UiAccordion/UiAccordion.vue'

const authStore = useAuthStore()
const isCollapsed = useLocalStorage('crm-sidebar-collapsed', false)
const searchQuery = ref('')

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// Проверка роли пользователя
const userRole = computed(() => authStore.profile?.role || 'operator')

const hasAdminAccess = computed(() => {
  return ['admin', 'superadmin'].includes(userRole.value)
})

// Отображение групп
const shouldShowGroup = (group: string) => {
  if (group === 'admin') return hasAdminAccess.value
  return true // Остальные группы доступны всем ролям по ТЗ
}

// Фильтрация меню
const filteredMenuContains = (itemName: string) => {
  if (!searchQuery.value) return true
  return itemName.toLowerCase().includes(searchQuery.value.toLowerCase())
}
</script>

<style lang="scss">
@use './AppSidebar.scss';
</style>
