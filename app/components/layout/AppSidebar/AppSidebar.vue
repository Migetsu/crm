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
        
      NuxtLink.app-sidebar__link(to="/vacancies", active-class="app-sidebar__link--active", v-if="canSeeVacancies && filteredMenuContains('Вакансии')")
        Briefcase(:size="18")
        span.app-sidebar__link-text(v-if="!isCollapsed") Вакансии
        
      NuxtLink.app-sidebar__link(to="/org-units", active-class="app-sidebar__link--active", v-if="canSeeOrgUnits && filteredMenuContains('Орг единицы')")
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

  .app-sidebar__footer
    .app-sidebar__dev-links
      a.app-sidebar__dev-link(
        href="https://github.com/Migetsu/crm",
        target="_blank",
        rel="noopener noreferrer",
        title="GitHub репозиторий проекта"
      )
        Github.app-sidebar__dev-icon(:size="18")
        span.app-sidebar__dev-text(v-if="!isCollapsed") GitHub проекта

      a.app-sidebar__dev-link.app-sidebar__dev-link--telegram(
        href="https://t.me/m1getsu",
        target="_blank",
        rel="noopener noreferrer",
        title="Telegram разработчика: @m1getsu"
      )
        svg.app-sidebar__dev-icon(
          viewBox="0 0 24 24",
          width="18",
          height="18",
          fill="currentColor",
          aria-hidden="true"
        )
          path(d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z")
        span.app-sidebar__dev-text(v-if="!isCollapsed") @m1getsu
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useAuthStore } from '~/stores/auth.store'
import { 
  Users, Briefcase, MapPin, Search, ChevronLeft, ChevronRight, 
  FileText, Mail, Settings, Github 
} from 'lucide-vue-next'
import UiAccordion from '~/components/ui/UiAccordion/UiAccordion.vue'

const authStore = useAuthStore()
const { canSeeVacancies, canSeeOrgUnits, canSeeAdminUsers } = useRolePermissions()
const isCollapsed = useLocalStorage('crm-sidebar-collapsed', false)
const searchQuery = ref('')

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// Отображение групп
const shouldShowGroup = (group: string) => {
  if (group === 'admin') return canSeeAdminUsers.value
  return true
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
