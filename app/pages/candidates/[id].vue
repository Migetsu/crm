<template lang="pug">
.page-candidate(v-if="!candidatesStore.isLoading && candidate")
  .page-candidate__top
    button.page-candidate__back(@click="$router.push('/')")
      ArrowLeft(:size="18")
      | Назад к витрине
      
  .page-candidate__layout
    //- Left panel
    .page-candidate__left
      .page-candidate__profile
        .page-candidate__avatar(:style="{ backgroundColor: avatarColor }")
          | {{ initials }}
        .page-candidate__details
          h1.page-candidate__name {{ fullName }}
          .page-candidate__meta
            span(v-if="age") {{ age }} лет
            span {{ citizenshipLabel }}
            span {{ sourceLabel }}
          .page-candidate__contacts
            .page-candidate__contact
              Phone(:size="14")
              | {{ candidate.phone }}
            .page-candidate__contact(v-if="candidate.email")
              Mail(:size="14")
              | {{ candidate.email }}
            .page-candidate__contact(v-if="candidate.address")
              MapPin(:size="14")
              | {{ candidate.address }}
        
      .page-candidate__actions
        UiButton(variant="secondary", size="sm", @click="showEditModal = true")
          template(#icon)
            Edit(:size="14")
          | Редактировать
        UiButton(variant="secondary", size="sm", @click="showCommentModal = true")
          template(#icon)
            MessageSquare(:size="14")
          | Комментировать
          
      //- Tabs
      .page-candidate__tabs
        button.page-candidate__tab(
          v-for="tab in tabs",
          :key="tab.id",
          :class="{ 'page-candidate__tab--active': activeTab === tab.id }",
          @click="activeTab = tab.id"
        ) {{ tab.label }}
        
      .page-candidate__tab-content
        //- Tab Resume
        .tab-resume(v-if="activeTab === 'resume'")
          .tab-resume__section
            h3.tab-resume__title Общая информация
            .tab-resume__grid
              .tab-resume__item
                span.tab-resume__label ФИО
                span.tab-resume__value {{ fullName }}
              .tab-resume__item
                span.tab-resume__label Дата рождения
                span.tab-resume__value {{ formattedBirthDate }}
              .tab-resume__item
                span.tab-resume__label Гражданство
                span.tab-resume__value {{ citizenshipLabel }}
              .tab-resume__item
                span.tab-resume__label Пол
                span.tab-resume__value {{ genderLabel }}
              .tab-resume__item
                span.tab-resume__label Телефон
                span.tab-resume__value {{ candidate.phone }}
              .tab-resume__item(v-if="candidate.email")
                span.tab-resume__label Почта
                span.tab-resume__value {{ candidate.email }}
              .tab-resume__item(v-if="candidate.address")
                span.tab-resume__label Адрес
                span.tab-resume__value {{ candidate.address }}
              .tab-resume__item(v-if="candidate.resume_link")
                span.tab-resume__label Резюме
                a.tab-resume__link(:href="candidate.resume_link", target="_blank") Открыть резюме
              .tab-resume__item
                span.tab-resume__label Источник
                span.tab-resume__value {{ sourceLabel }}
              .tab-resume__item
                span.tab-resume__label Способ добавления
                span.tab-resume__value {{ addMethodLabel }}
        
        //- Tab History
        .tab-history(v-if="activeTab === 'history'")
          .tab-history__empty(v-if="history.length === 0") Нет записей
          .tab-history__event(v-for="event in history", :key="event.id")
            .tab-history__event-icon
              Clock(:size="14")
            .tab-history__event-content
              span.tab-history__event-title {{ event.title }}
              span.tab-history__event-body(v-if="event.body") {{ event.body }}
              span.tab-history__event-date {{ formatHistoryDate(event.created_at) }}
        
        //- Tab Attachments
        .tab-attachments(v-if="activeTab === 'attachments'")
          p.tab-attachments__placeholder Раздел вложений будет доступен в ближайшем обновлении.
          
        //- Tab Consent
        .tab-consent(v-if="activeTab === 'consent'")
          p.tab-consent__placeholder Информация о согласиях будет доступна в ближайшем обновлении.
        
    //- Right panel
    .page-candidate__right
      .page-candidate__status-card
        h3.page-candidate__status-title Статус
        .page-candidate__status-badge(:style="{ backgroundColor: statusBgColor, color: statusColor }")
          | {{ statusLabel }}
        UiButton(variant="primary", size="sm", @click="showStatusModal = true")
          | Изменить статус ▶
        .page-candidate__status-date
          | Последнее изменение
          br
          | {{ formattedUpdatedAt }}
          
      .page-candidate__vacancy-card(v-if="vacancy")
        h3.page-candidate__card-title Вакансия
        NuxtLink.page-candidate__card-link(:to="`/vacancies/${vacancy.id}`") {{ vacancy.title }}
  
  //- Modals
  CandidateStatusModal(
    v-model="showStatusModal",
    :candidate="candidate",
    @updated="refreshData"
  )
  
  //- Comment modal
  UiModal(v-model="showCommentModal", title="Добавить комментарий", size="sm")
    textarea.comment-textarea(v-model="commentText", placeholder="Введите комментарий...")
    template(#footer)
      UiButton(variant="secondary", @click="showCommentModal = false") Отмена
      UiButton(variant="primary", @click="addComment") Сохранить

.page-candidate__loading(v-else-if="candidatesStore.isLoading")
  .page-candidates__spinner
  | Загрузка...
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Phone, Mail, MapPin, Edit, MessageSquare, Clock } from 'lucide-vue-next'
import { format, differenceInYears } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useCandidatesStore } from '~/stores/candidates.store'
import { VacanciesService } from '~/services/vacancies.service'
import { HistoryService } from '~/services/history.service'
import { STATUS_LABELS, STATUS_COLORS, CITIZENSHIP_LABELS, GENDER_LABELS, SOURCE_LABELS, ADD_METHOD_LABELS } from '~/types/candidate.types'
import type { HistoryEvent } from '~/types/history.types'
import type { Vacancy } from '~/types/vacancy.types'

const route = useRoute()
const candidatesStore = useCandidatesStore()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const vacanciesService = new VacanciesService(supabase as any)
const historyService = new HistoryService(supabase as any)

const candidate = computed(() => candidatesStore.currentCandidate)
const vacancy = ref<Vacancy | null>(null)
const history = ref<HistoryEvent[]>([])
const activeTab = ref('resume')
const showStatusModal = ref(false)
const showEditModal = ref(false)
const showCommentModal = ref(false)
const commentText = ref('')

const tabs = [
  { id: 'resume', label: 'Резюме' },
  { id: 'history', label: 'История' },
  { id: 'attachments', label: 'Вложения' },
  { id: 'consent', label: 'Согласия' },
]

onMounted(async () => {
  await refreshData()
})

const refreshData = async () => {
  const id = route.params.id as string
  await candidatesStore.fetchById(id)
  
  if (candidate.value) {
    history.value = await historyService.fetchByCandidateId(candidate.value.id)
    if (candidate.value.vacancy_id) {
      try {
        vacancy.value = await vacanciesService.fetchById(candidate.value.vacancy_id)
      } catch { /* vacancy might not exist */ }
    }
  }
}

const fullName = computed(() => {
  if (!candidate.value) return ''
  const parts = [candidate.value.last_name, candidate.value.first_name]
  if (candidate.value.middle_name) parts.push(candidate.value.middle_name)
  return parts.join(' ')
})

const initials = computed(() => {
  if (!candidate.value) return ''
  return (candidate.value.last_name[0] + candidate.value.first_name[0]).toUpperCase()
})

const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1']

const avatarColor = computed(() => {
  if (!candidate.value) return '#3b82f6'
  let hash = 0
  for (const char of candidate.value.id) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
})

const age = computed(() => {
  if (!candidate.value?.birth_date) return null
  return differenceInYears(new Date(), new Date(candidate.value.birth_date))
})

const statusLabel = computed(() => candidate.value ? STATUS_LABELS[candidate.value.status] : '')
const statusColor = computed(() => candidate.value ? STATUS_COLORS[candidate.value.status] : '')
const statusBgColor = computed(() => statusColor.value + '1a')
const citizenshipLabel = computed(() => candidate.value ? CITIZENSHIP_LABELS[candidate.value.citizenship] || candidate.value.citizenship : '')
const genderLabel = computed(() => candidate.value ? GENDER_LABELS[candidate.value.gender] : '')
const sourceLabel = computed(() => candidate.value ? SOURCE_LABELS[candidate.value.source] : '')
const addMethodLabel = computed(() => candidate.value ? ADD_METHOD_LABELS[candidate.value.add_method] : '')

const formattedBirthDate = computed(() => {
  if (!candidate.value?.birth_date) return ''
  try {
    const d = new Date(candidate.value.birth_date)
    const formatted = format(d, 'dd MMMM yyyy', { locale: ru })
    return age.value !== null ? `${formatted} (${age.value} лет)` : formatted
  } catch { return candidate.value.birth_date }
})

const formattedUpdatedAt = computed(() => {
  if (!candidate.value?.updated_at) return ''
  try { return format(new Date(candidate.value.updated_at), 'dd.MM.yyyy HH:mm') }
  catch { return candidate.value.updated_at }
})

const formatHistoryDate = (dateStr: string) => {
  try { return format(new Date(dateStr), 'dd.MM.yyyy HH:mm') }
  catch { return dateStr }
}

const addComment = async () => {
  if (!candidate.value || !commentText.value.trim()) return
  await historyService.create({
    candidate_id: candidate.value.id,
    type: 'comment',
    title: 'Комментарий',
    body: commentText.value.trim(),
    created_by: user.value?.id || null,
    meta: null,
  })
  showCommentModal.value = false
  commentText.value = ''
  history.value = await historyService.fetchByCandidateId(candidate.value.id)
}
</script>

<style lang="scss">
.page-candidate {
  &__top {
    margin-bottom: var(--spacing-6);
  }
  
  &__back {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-text-secondary);
    transition: color 0.2s;
    
    &:hover {
      color: var(--color-primary);
    }
  }
  
  &__layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
  }
  
  &__left {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  &__profile {
    display: flex;
    gap: 20px;
    padding: 24px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }
  
  &__avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 22px;
    flex-shrink: 0;
  }
  
  &__details {
    flex: 1;
  }
  
  &__name {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  &__meta {
    display: flex;
    gap: 12px;
    font-size: 14px;
    color: var(--color-text-secondary);
    margin-bottom: 12px;
    
    span + span::before {
      content: '·';
      margin-right: 12px;
    }
  }
  
  &__contacts {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  &__contact {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-text-secondary);
  }
  
  &__actions {
    display: flex;
    gap: 8px;
  }
  
  &__tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--color-border);
  }
  
  &__tab {
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.2s;
    
    &:hover {
      color: var(--color-text-primary);
    }
    
    &--active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
    }
  }
  
  &__tab-content {
    padding-top: 20px;
  }
  
  &__right {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  &__status-card,
  &__vacancy-card {
    padding: 20px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  &__status-title,
  &__card-title {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text-secondary);
  }
  
  &__status-badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: var(--radius-full);
    font-size: 14px;
    font-weight: 600;
    text-align: center;
  }
  
  &__status-date {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.4;
  }
  
  &__card-link {
    color: var(--color-primary);
    font-size: 14px;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 80px 0;
    color: var(--color-text-secondary);
  }
}

.tab-resume {
  &__section {
    margin-bottom: 24px;
  }
  
  &__title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--color-text-primary);
  }
  
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  &__item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  &__label {
    font-size: 12px;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  
  &__value {
    font-size: 14px;
    color: var(--color-text-primary);
  }
  
  &__link {
    font-size: 14px;
    color: var(--color-primary);
    
    &:hover { text-decoration: underline; }
  }
}

.tab-history {
  &__empty {
    text-align: center;
    padding: 40px;
    color: var(--color-text-secondary);
  }
  
  &__event {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);
    
    &:last-child { border-bottom: none; }
  }
  
  &__event-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: var(--color-bg-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }
  
  &__event-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  &__event-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary);
  }
  
  &__event-body {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  
  &__event-date {
    font-size: 12px;
    color: var(--color-text-secondary);
    opacity: 0.7;
  }
}

.tab-attachments__placeholder,
.tab-consent__placeholder {
  text-align: center;
  padding: 40px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.comment-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  background-color: var(--color-bg-body);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 14px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}
</style>
