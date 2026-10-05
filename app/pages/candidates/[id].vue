<template lang="pug">
.page-candidate(v-if="candidate")
  .page-candidate__top
    button.page-candidate__back(@click="$router.push('/')")
      ArrowLeft(:size="18")
      | Назад к витрине
    .page-candidate__top-actions
      UiButton(variant="secondary", size="sm", @click="showEditModal = true")
        template(#icon)
          Edit(:size="15")
        | Редактировать
      UiButton(v-if="permissions.canRemoveCandidate.value", variant="danger", size="sm", @click="handleDeleteCandidate")
        template(#icon)
          Trash2(:size="15")
        | Удалить кандидата
      
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
              a.page-candidate__contact-link(:href="`tel:${candidate.phone}`") {{ candidate.phone }}
            .page-candidate__contact(v-if="candidate.email")
              Mail(:size="14")
              a.page-candidate__contact-link(:href="`mailto:${candidate.email}`") {{ candidate.email }}
            .page-candidate__contact(v-if="candidate.address")
              MapPin(:size="14")
              | {{ candidate.address }}
        
      //- Quick Actions Bar
      .page-candidate__actions
        UiButton(variant="primary", size="sm", @click="openCallModal")
          template(#icon)
            PhoneCall(:size="14")
          | Позвонить
        UiButton(variant="secondary", size="sm", @click="openMessageModal('sms')")
          template(#icon)
            MessageSquare(:size="14")
          | Отправить SMS
        UiButton(variant="secondary", size="sm", :disabled="!candidate.email", @click="openMessageModal('email')")
          template(#icon)
            Mail(:size="14")
          | Отправить Email
        UiButton(variant="secondary", size="sm", @click="showEditModal = true")
          template(#icon)
            Edit(:size="14")
          | Редактировать
        UiButton(variant="secondary", size="sm", @click="showCommentModal = true")
          template(#icon)
            MessageCircle(:size="14")
          | Заметка
          
      //- Navigation Tabs
      .page-candidate__tabs
        button.page-candidate__tab(
          v-for="tab in tabs",
          :key="tab.id",
          :class="{ 'page-candidate__tab--active': activeTab === tab.id }",
          @click="activeTab = tab.id"
        )
          | {{ tab.label }}
          span.page-candidate__tab-badge(v-if="tab.id === 'attachments' && attachments.length > 0") {{ attachments.length }}
          span.page-candidate__tab-badge(v-else-if="tab.id === 'history' && history.length > 0") {{ history.length }}
        
      .page-candidate__tab-content
        //- ================= TAB 1: RESUME =================
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
              .tab-resume__item
                span.tab-resume__label Источник
                span.tab-resume__value {{ sourceLabel }}
              .tab-resume__item
                span.tab-resume__label Способ добавления
                span.tab-resume__value {{ addMethodLabel }}
              .tab-resume__item(v-if="candidate.recommended_by")
                span.tab-resume__label Рекомендован
                span.tab-resume__value {{ candidate.recommended_by }}

          //- PDF / Document Viewer Section
          .tab-resume__section
            h3.tab-resume__title Резюме кандидата
            CandidateResumeViewer(
              :url="candidate.resume_link",
              :file-name="mainResumeFileName"
            )
              template(#upload-action)
                .tab-resume__upload-prompt
                  UiFileUpload(
                    label="Загрузить файл резюме",
                    :is-uploading="isUploadingResume",
                    @file-selected="handleResumeUpload"
                  )

        //- ================= TAB 2: LIVE TIMELINE =================
        .tab-history(v-if="activeTab === 'history'")
          .tab-history__empty(v-if="history.length === 0")
            Clock(:size="32")
            p История взаимодействий пока пуста
          .tab-history__timeline(v-else)
            .tab-history__item(v-for="event in history", :key="event.id", :class="`tab-history__item--${event.type}`")
              .tab-history__icon-wrapper
                component(:is="getEventIcon(event.type)", :size="16")
              .tab-history__content
                .tab-history__header
                  span.tab-history__title {{ event.title }}
                  span.tab-history__date {{ formatHistoryDate(event.created_at) }}
                
                //- Author info
                .tab-history__author(v-if="event.author")
                  span.tab-history__author-name {{ event.author.full_name || event.author.email }}
                  span.tab-history__author-role(v-if="event.author.role") {{ getRoleBadge(event.author.role) }}

                //- Status details / reason
                .tab-history__meta-card(v-if="event.meta && (event.meta.reason || event.meta.next_contact_date || event.meta.interview_date)")
                  .tab-history__meta-row(v-if="event.meta.reason")
                    span.tab-history__meta-label Причина:
                    span.tab-history__meta-value {{ getReasonLabel(event.meta.reason) }}
                  .tab-history__meta-row(v-if="event.meta.next_contact_date")
                    span.tab-history__meta-label Следующий контакт:
                    span.tab-history__meta-value {{ formatDateTime(event.meta.next_contact_date) }}
                  .tab-history__meta-row(v-if="event.meta.interview_date")
                    span.tab-history__meta-label Собеседование:
                    span.tab-history__meta-value {{ formatDateTime(event.meta.interview_date) }}
                  .tab-history__meta-row(v-if="event.meta.interview_address")
                    span.tab-history__meta-label Адрес собеседования:
                    span.tab-history__meta-value {{ event.meta.interview_address }}

                //- Body / comment / message
                .tab-history__body(v-if="event.body") {{ event.body }}

        //- ================= TAB 3: ATTACHMENTS =================
        .tab-attachments(v-if="activeTab === 'attachments'")
          .tab-attachments__uploader
            h3.tab-attachments__title Загрузить новый документ
            UiFileUpload(
              label="Выберите или перетащите резюме/файл (PDF, DOCX, DOC)",
              :is-uploading="isUploadingAttachment",
              @file-selected="handleAttachmentUpload"
            )

          .tab-attachments__list-section
            h3.tab-attachments__title Прикреплённые файлы ({{ allAttachmentsList.length }})
            .tab-attachments__empty(v-if="allAttachmentsList.length === 0")
              Paperclip(:size="32")
              p Вложений пока нет. Загрузите файл через форму выше.
            .tab-attachments__list(v-else)
              .tab-attachments__card(v-for="file in allAttachmentsList", :key="file.path")
                .tab-attachments__card-icon
                  FileText(:size="24")
                .tab-attachments__card-info
                  span.tab-attachments__card-name {{ file.name }}
                  .tab-attachments__card-meta
                    span(v-if="file.size") {{ formatFileSize(file.size) }}
                    span ·
                    span {{ formatDateTime(file.createdAt) }}
                .tab-attachments__card-actions
                  a.tab-attachments__btn(:href="file.url", target="_blank", title="Открыть файл")
                    ExternalLink(:size="16")
                  a.tab-attachments__btn(:href="file.url", download, title="Скачать файл")
                    Download(:size="16")
                  button.tab-attachments__btn.tab-attachments__btn--danger(
                    v-if="!file.isExternal",
                    type="button",
                    title="Удалить файл",
                    @click="deleteAttachment(file)"
                  )
                    Trash2(:size="16")

        //- ================= TAB 4: CONSENT =================
        .tab-consent(v-if="activeTab === 'consent'")
          .tab-consent__card
            .tab-consent__header
              .tab-consent__status-badge(:class="latestConsent && latestConsent.meta?.consent_granted ? 'tab-consent__status-badge--granted' : 'tab-consent__status-badge--missing'")
                ShieldCheck(:size="18")
                span {{ latestConsent && latestConsent.meta?.consent_granted ? 'Согласие на обработку ПДн получено' : 'Согласие не зафиксировано / отозвано' }}
              span.tab-consent__law 152-ФЗ «О персональных данных»

            .tab-consent__info(v-if="latestConsent && latestConsent.meta?.consent_granted")
              .tab-consent__info-row
                span.tab-consent__label Дата фиксации:
                span.tab-consent__value {{ formatDateTime(latestConsent.created_at) }}
              .tab-consent__info-row(v-if="latestConsent.meta.consent_method")
                span.tab-consent__label Способ получения:
                span.tab-consent__value {{ getConsentMethodLabel(latestConsent.meta.consent_method) }}
              .tab-consent__info-row(v-if="latestConsent.author")
                span.tab-consent__label Кто зафиксировал:
                span.tab-consent__value {{ latestConsent.author.full_name || latestConsent.author.email }}
              .tab-consent__info-row(v-if="latestConsent.body")
                span.tab-consent__label Примечание:
                span.tab-consent__value {{ latestConsent.body }}

            .tab-consent__form
              h4.tab-consent__form-title Изменить статус согласия
              .tab-consent__form-grid
                UiSelect(
                  v-model="consentForm.method",
                  label="Способ подтверждения",
                  :options="consentMethodOptions"
                )
                UiInput(
                  v-model="consentForm.comment",
                  label="Примечание / основание",
                  placeholder="Например, отклик на HH.ru от 05.10.2026"
                )
              .tab-consent__form-actions
                UiButton(
                  variant="primary",
                  size="sm",
                  :disabled="isSubmittingConsent",
                  @click="saveConsent(true)"
                )
                  template(#icon)
                    ShieldCheck(:size="15")
                  | Зафиксировать получение согласия
                UiButton(
                  v-if="latestConsent && latestConsent.meta?.consent_granted",
                  variant="secondary",
                  size="sm",
                  :disabled="isSubmittingConsent",
                  @click="saveConsent(false)"
                )
                  | Отозвать согласие
        
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

  //- Status Change Modal
  CandidateStatusModal(
    v-model="showStatusModal",
    :candidate="candidate",
    @updated="refreshData"
  )
  
  //- Quick Call Modal
  CandidateCallModal(
    v-model="showCallModal",
    :candidate="candidate",
    @logged="refreshData"
  )

  //- Quick SMS / Email Modal
  CandidateMessageModal(
    v-model="showMessageModal",
    :type="activeMessageType",
    :candidate="candidate",
    :vacancy="vacancy",
    @sent="refreshData"
  )
  
  //- Comment Modal
  UiModal(v-model="showCommentModal", title="Добавить заметку", size="sm")
    textarea.comment-textarea(v-model="commentText", placeholder="Введите заметку о кандидате...")
    template(#footer)
      UiButton(variant="secondary", @click="showCommentModal = false") Отмена
      UiButton(variant="primary", :disabled="!commentText.trim()", @click="addComment") Сохранить

  //- Candidate Edit Modal
  CandidateEditModal(
    v-model="showEditModal",
    :candidate="candidate",
    @updated="refreshData"
  )

.page-candidate.page-candidate--skeleton(v-else-if="candidatesStore.isLoading && !candidate", aria-hidden="true")
  .page-candidate__top
    UiSkeleton(width="140px", height="24px")
  .page-candidate__layout
    .page-candidate__left
      .page-candidate__profile
        UiSkeleton(width="72px", height="72px", border-radius="50%", variant="circle")
        .page-candidate__details(style="display: flex; flex-direction: column; gap: 8px; flex: 1;")
          UiSkeleton(width="260px", height="28px")
          UiSkeleton(width="180px", height="16px")
          .page-candidate__contacts(style="display: flex; gap: 16px; margin-top: 4px;")
            UiSkeleton(width="130px", height="16px")
            UiSkeleton(width="150px", height="16px")
      .page-candidate__actions(style="display: flex; gap: 8px;")
        UiSkeleton(width="110px", height="32px", border-radius="6px")
        UiSkeleton(width="130px", height="32px", border-radius="6px")
        UiSkeleton(width="130px", height="32px", border-radius="6px")
        UiSkeleton(width="100px", height="32px", border-radius="6px")
      .page-candidate__tabs(style="display: flex; gap: 8px; margin-top: 10px;")
        UiSkeleton(width="90px", height="36px", border-radius="8px")
        UiSkeleton(width="110px", height="36px", border-radius="8px")
        UiSkeleton(width="100px", height="36px", border-radius="8px")
        UiSkeleton(width="90px", height="36px", border-radius="8px")
      .page-candidate__tab-content(style="margin-top: 10px;")
        UiSkeleton(width="100%", height="260px", border-radius="12px")
    .page-candidate__right
      .page-candidate__status-card(style="display: flex; flex-direction: column; gap: 14px;")
        UiSkeleton(width="120px", height="16px")
        UiSkeleton(width="100%", height="38px", border-radius="8px")
        UiSkeleton(width="100%", height="42px", border-radius="8px")
      .page-candidate__vacancy-card(style="margin-top: 20px; display: flex; flex-direction: column; gap: 12px;")
        UiSkeleton(width="140px", height="16px")
        UiSkeleton(width="100%", height="22px")
        UiSkeleton(width="80%", height="14px")
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Phone, Mail, MapPin, MessageSquare, Clock, PhoneCall,
  MessageCircle, Paperclip, ShieldCheck, FileText, Download, ExternalLink, Trash2, Edit,
} from 'lucide-vue-next'
import { format, differenceInYears } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useCandidatesStore } from '~/stores/candidates.store'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'
import { VacanciesService } from '~/services/vacancies.service'
import { HistoryService } from '~/services/history.service'
import { StorageService, type StorageFileItem } from '~/services/storage.service'
import { formatFileSize } from '~/utils/file-validation'
import UiSkeleton from '~/components/ui/UiSkeleton/UiSkeleton.vue'
import CandidateEditModal from '~/components/candidates/CandidateEditModal/CandidateEditModal.vue'
import {
  STATUS_LABELS, STATUS_COLORS, CITIZENSHIP_LABELS, GENDER_LABELS,
  SOURCE_LABELS, ADD_METHOD_LABELS, REJECTED_LABELS, SELF_REJECTED_LABELS,
  RESERVE_LABELS, NO_FEEDBACK_LABELS,
} from '~/types/candidate.types'
import type { HistoryEvent, HistoryEventType } from '~/types/history.types'
import type { Vacancy } from '~/types/vacancy.types'
import type { TemplateType } from '~/types/template.types'

const route = useRoute()
const router = useRouter()
const candidatesStore = useCandidatesStore()
const toast = useToast()
const confirm = useConfirm()
const permissions = useRolePermissions()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const vacanciesService = new VacanciesService(supabase)
const historyService = new HistoryService(supabase)
const storageService = new StorageService(supabase)

const candidate = computed(() => candidatesStore.currentCandidate)
const vacancy = ref<Vacancy | null>(null)
const history = ref<HistoryEvent[]>([])
const attachments = ref<StorageFileItem[]>([])
const activeTab = ref('resume')

// Modals
const showStatusModal = ref(false)
const showEditModal = ref(false)
const showCommentModal = ref(false)
const showCallModal = ref(false)
const showMessageModal = ref(false)
const activeMessageType = ref<TemplateType>('sms')
const commentText = ref('')

// Storage & uploads
const isUploadingResume = ref(false)
const isUploadingAttachment = ref(false)
const isSubmittingConsent = ref(false)

const consentForm = reactive({
  method: 'hh',
  comment: '',
})

const consentMethodOptions = [
  { value: 'hh', label: 'Отклик на вакансию (HH.ru / Авито)' },
  { value: 'phone', label: 'Устное согласие при первом звонке' },
  { value: 'written', label: 'Письменное заявление на собеседовании' },
  { value: 'online', label: 'Электронная форма / SMS-код' },
]

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
    await loadAttachments()
    if (candidate.value.vacancy_id) {
      try {
        vacancy.value = await vacanciesService.fetchById(candidate.value.vacancy_id)
      } catch { /* vacancy might not exist */ }
    }
  }
}

const loadAttachments = async () => {
  if (!candidate.value) return
  attachments.value = await storageService.listResumes(candidate.value.id)
}

const allAttachmentsList = computed(() => {
  const items: Array<StorageFileItem & { isExternal?: boolean }> = [...attachments.value]
  // If candidate has resume_link that isn't in items, show it too
  if (candidate.value?.resume_link && !items.some(i => i.url === candidate.value?.resume_link)) {
    items.unshift({
      name: mainResumeFileName.value,
      path: candidate.value.resume_link,
      url: candidate.value.resume_link,
      size: 0,
      createdAt: candidate.value.created_at || new Date().toISOString(),
      isPdf: candidate.value.resume_link.toLowerCase().includes('.pdf'),
      isExternal: true,
    })
  }
  return items
})

const mainResumeFileName = computed(() => {
  if (!candidate.value?.resume_link) return 'Резюме кандидата'
  const urlParts = candidate.value.resume_link.split('/')
  const raw = urlParts[urlParts.length - 1] || 'Резюме'
  return decodeURIComponent(raw).replace(/^\d+_/, '')
})

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

const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return ''
  try { return format(new Date(dateStr), 'dd.MM.yyyy HH:mm') }
  catch { return dateStr }
}

const formatHistoryDate = (dateStr: string) => {
  try { return format(new Date(dateStr), 'dd.MM.yyyy HH:mm') }
  catch { return dateStr }
}

// Quick action callers
const openCallModal = () => {
  if (candidate.value?.phone) {
    window.location.href = `tel:${candidate.value.phone}`
  }
  showCallModal.value = true
}

const openMessageModal = (type: TemplateType) => {
  activeMessageType.value = type
  showMessageModal.value = true
}

// History helpers
const getEventIcon = (type: HistoryEventType) => {
  switch (type) {
    case 'status_change': return Clock
    case 'call': return PhoneCall
    case 'sms': return MessageSquare
    case 'email': return Mail
    case 'attachment': return Paperclip
    case 'consent': return ShieldCheck
    case 'comment': default: return MessageCircle
  }
}

const getRoleBadge = (role: string) => {
  const map: Record<string, string> = {
    superadmin: 'Супер Админ',
    director: 'Директор',
    regional_manager: 'РМП',
    manager: 'Менеджер',
    recruiter: 'Рекрутер',
  }
  return map[role] || role
}

const allReasonLabels: Record<string, string> = {
  ...REJECTED_LABELS,
  ...SELF_REJECTED_LABELS,
  ...RESERVE_LABELS,
  ...NO_FEEDBACK_LABELS,
}

const getReasonLabel = (reasonKey: string) => {
  return allReasonLabels[reasonKey] || reasonKey
}

// Consent helpers
const latestConsent = computed(() => {
  return history.value.find(e => e.type === 'consent') || null
})

const getConsentMethodLabel = (methodKey: string) => {
  const match = consentMethodOptions.find(o => o.value === methodKey)
  return match?.label || methodKey
}

const saveConsent = async (granted: boolean) => {
  if (!candidate.value) return
  isSubmittingConsent.value = true
  try {
    const title = granted ? 'Получено согласие на обработку ПДн' : 'Отозвано согласие на обработку ПДн'
    await historyService.create({
      candidate_id: candidate.value.id,
      type: 'consent',
      title,
      body: consentForm.comment.trim() || null,
      created_by: user.value?.id || null,
      meta: {
        consent_granted: granted,
        consent_method: consentForm.method,
      },
    })
    consentForm.comment = ''
    await refreshData()
    toast.success(granted ? 'Согласие на обработку ПДн зафиксировано' : 'Согласие на обработку ПДн отозвано')
  } catch (err: unknown) {
    toast.error('Не удалось зафиксировать согласие')
    console.error(err)
  } finally {
    isSubmittingConsent.value = false
  }
}

// Resume & attachment uploads
const handleResumeUpload = async (file: File | null) => {
  if (!file || !candidate.value) return
  isUploadingResume.value = true
  try {
    const uploadRes = await storageService.uploadResume(candidate.value.id, file)
    await candidatesStore.update(candidate.value.id, { resume_link: uploadRes.url })
    await historyService.create({
      candidate_id: candidate.value.id,
      type: 'attachment',
      title: `Обновлено резюме: ${uploadRes.name}`,
      body: null,
      created_by: user.value?.id || null,
      meta: {
        file_name: uploadRes.name,
        file_url: uploadRes.url,
        file_size: uploadRes.size,
      },
    })
    await refreshData()
    toast.success('Файл резюме успешно обновлен')
  } catch (err: unknown) {
    toast.error('Не удалось загрузить файл резюме')
    console.error('Failed to upload resume:', err)
  } finally {
    isUploadingResume.value = false
  }
}

const handleAttachmentUpload = async (file: File | null) => {
  if (!file || !candidate.value) return
  isUploadingAttachment.value = true
  try {
    const uploadRes = await storageService.uploadResume(candidate.value.id, file)
    await historyService.create({
      candidate_id: candidate.value.id,
      type: 'attachment',
      title: `Добавлено вложение: ${uploadRes.name}`,
      body: null,
      created_by: user.value?.id || null,
      meta: {
        file_name: uploadRes.name,
        file_url: uploadRes.url,
        file_size: uploadRes.size,
      },
    })
    await refreshData()
    toast.success('Вложение успешно добавлено')
  } catch (err: unknown) {
    toast.error('Не удалось прикрепить файл')
    console.error('Failed to upload attachment:', err)
  } finally {
    isUploadingAttachment.value = false
  }
}

const deleteAttachment = async (item: StorageFileItem) => {
  if (!candidate.value) return
  const confirmed = await confirm.confirm({
    title: 'Удаление вложения',
    message: `Вы уверены, что хотите удалить файл «${item.name}»? Это действие нельзя отменить.`,
    confirmText: 'Удалить файл',
    cancelText: 'Отмена',
    variant: 'danger',
    icon: 'trash',
  })
  if (!confirmed) return

  try {
    await storageService.deleteResume(item.path)
    await historyService.create({
      candidate_id: candidate.value.id,
      type: 'attachment',
      title: `Удалено вложение: ${item.name}`,
      body: null,
      created_by: user.value?.id || null,
      meta: { file_name: item.name },
    })
    await refreshData()
    toast.success(`Файл «${item.name}» удален`)
  } catch (err: unknown) {
    toast.error('Не удалось удалить файл')
    console.error('Failed to delete attachment:', err)
  }
}

const handleDeleteCandidate = async () => {
  if (!candidate.value) return
  const confirmed = await confirm.confirm({
    title: 'Удаление кандидата',
    message: `Вы действительно хотите удалить кандидата «${fullName.value}»? Вся история и прикрепленные файлы будут безвозвратно удалены.`,
    confirmText: 'Удалить кандидата',
    cancelText: 'Отмена',
    variant: 'danger',
    icon: 'trash',
  })
  if (!confirmed) return

  try {
    const success = await candidatesStore.deleteCandidate(candidate.value.id)
    if (success) {
      toast.success('Кандидат успешно удален')
      router.push('/')
    } else {
      toast.error('Не удалось удалить кандидата')
    }
  } catch (err: unknown) {
    toast.error('Ошибка при удалении кандидата')
    console.error(err)
  }
}

const addComment = async () => {
  if (!candidate.value || !commentText.value.trim()) return
  try {
    await historyService.create({
      candidate_id: candidate.value.id,
      type: 'comment',
      title: 'Заметка о кандидате',
      body: commentText.value.trim(),
      created_by: user.value?.id || null,
      meta: null,
    })
    showCommentModal.value = false
    commentText.value = ''
    history.value = await historyService.fetchByCandidateId(candidate.value.id)
    toast.success('Заметка о кандидате добавлена')
  } catch (err: unknown) {
    toast.error('Не удалось сохранить заметку')
    console.error(err)
  }
}
</script>

<style lang="scss">
.page-candidate {
  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-6);
  }

  &__top-actions {
    display: flex;
    align-items: center;
    gap: 8px;
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
    gap: 20px;
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

  &__contact-link {
    color: var(--color-text-primary);
    text-decoration: none;

    &:hover {
      color: var(--color-primary);
      text-decoration: underline;
    }
  }
  
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  &__tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--color-border);
  }
  
  &__tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
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

  &__tab-badge {
    background-color: var(--color-bg-hover);
    color: var(--color-text-secondary);
    padding: 2px 7px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 600;
  }
  
  &__tab-content {
    padding-top: 10px;
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
  display: flex;
  flex-direction: column;
  gap: 24px;

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
    padding: 16px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
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

  &__upload-prompt {
    margin-top: 14px;
    width: 100%;
    max-width: 450px;
  }
}

.tab-history {
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
    padding: 60px;
    color: var(--color-text-secondary);
  }

  &__timeline {
    display: flex;
    flex-direction: column;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 17px;
      top: 16px;
      bottom: 16px;
      width: 2px;
      background-color: var(--color-border);
    }
  }
  
  &__item {
    display: flex;
    gap: 16px;
    padding: 16px 0;
    position: relative;
  }
  
  &__icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: var(--color-bg-card);
    border: 2px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    flex-shrink: 0;
    z-index: 1;
  }

  &__item--status_change &__icon-wrapper {
    border-color: var(--color-primary);
    background-color: rgba(59, 130, 246, 0.1);
  }

  &__item--call &__icon-wrapper {
    border-color: #10b981;
    color: #10b981;
    background-color: rgba(16, 185, 129, 0.1);
  }

  &__item--sms &__icon-wrapper {
    border-color: #8b5cf6;
    color: #8b5cf6;
    background-color: rgba(139, 92, 246, 0.1);
  }

  &__item--email &__icon-wrapper {
    border-color: #06b6d4;
    color: #06b6d4;
    background-color: rgba(6, 182, 212, 0.1);
  }

  &__item--consent &__icon-wrapper {
    border-color: #10b981;
    color: #10b981;
    background-color: rgba(16, 185, 129, 0.1);
  }
  
  &__content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 14px 16px;
  }
  
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  
  &__date {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  &__author {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }

  &__author-name {
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  &__author-role {
    padding: 2px 8px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  &__meta-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    background-color: var(--color-bg-body);
    border-left: 3px solid var(--color-primary);
    border-radius: var(--radius-sm);
    margin-top: 4px;
  }

  &__meta-row {
    display: flex;
    gap: 6px;
    font-size: 13px;
  }

  &__meta-label {
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  &__meta-value {
    color: var(--color-text-primary);
    font-weight: 600;
  }

  &__body {
    font-size: 13px;
    color: var(--color-text-primary);
    line-height: 1.5;
    white-space: pre-wrap;
    background-color: var(--color-bg-body);
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    margin-top: 4px;
  }
}

.tab-attachments {
  display: flex;
  flex-direction: column;
  gap: 24px;

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 12px;
  }

  &__list-section {
    display: flex;
    flex-direction: column;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px;
    background-color: var(--color-bg-card);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    text-align: center;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition: border-color 0.2s;

    &:hover {
      border-color: var(--color-primary);
    }
  }

  &__card-icon {
    color: var(--color-primary);
    display: flex;
    align-items: center;
  }

  &__card-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__card-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__card-meta {
    display: flex;
    gap: 6px;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  &__card-actions {
    display: flex;
    gap: 6px;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: var(--color-primary);
      border-color: var(--color-primary);
    }

    &--danger:hover {
      color: var(--color-danger);
      border-color: var(--color-danger);
    }
  }
}

.tab-consent {
  &__card {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 24px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__status-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 600;

    &--granted {
      background-color: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }

    &--missing {
      background-color: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
  }

  &__law {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  &__info-row {
    display: flex;
    gap: 8px;
    font-size: 13px;
  }

  &__label {
    color: var(--color-text-secondary);
    font-weight: 500;
    min-width: 140px;
  }

  &__value {
    color: var(--color-text-primary);
    font-weight: 500;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--color-border);
  }

  &__form-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  &__form-actions {
    display: flex;
    gap: 12px;
    margin-top: 6px;
  }
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
