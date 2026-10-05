<template lang="pug">
.resume-viewer
  .resume-viewer__header
    .resume-viewer__title-group
      FileText(:size="18")
      h4.resume-viewer__title Резюме кандидата
    .resume-viewer__actions(v-if="url")
      a.resume-viewer__action-btn(:href="url", target="_blank", rel="noopener noreferrer", title="Открыть в новой вкладке")
        ExternalLink(:size="15")
        span В новой вкладке
      a.resume-viewer__action-btn(:href="url", download, title="Скачать файл")
        Download(:size="15")
        span Скачать

  .resume-viewer__body(v-if="url")
    //- PDF Embed Viewer
    .resume-viewer__frame-container(v-if="isPdf")
      iframe.resume-viewer__iframe(
        :src="embedUrl",
        title="Предпросмотр резюме PDF"
      )
    //- Non-PDF document display
    .resume-viewer__doc-card(v-else)
      .resume-viewer__doc-icon
        FileText(:size="48")
      .resume-viewer__doc-info
        span.resume-viewer__doc-name {{ fileName || 'Файл резюме' }}
        span.resume-viewer__doc-hint Документ доступен для скачивания и просмотра
      .resume-viewer__doc-actions
        a.resume-viewer__btn.resume-viewer__btn--primary(:href="url", target="_blank")
          ExternalLink(:size="16")
          | Открыть документ
        a.resume-viewer__btn.resume-viewer__btn--secondary(:href="url", download)
          Download(:size="16")
          | Скачать

  .resume-viewer__empty(v-else)
    FileQuestion(:size="36")
    p.resume-viewer__empty-text Резюме не загружено
    slot(name="upload-action")
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FileText, ExternalLink, Download, FileQuestion } from 'lucide-vue-next'

const props = defineProps<{
  url?: string | null
  fileName?: string
}>()

const isPdf = computed(() => {
  if (!props.url) return false
  const lower = (props.fileName || props.url).toLowerCase()
  return lower.includes('.pdf')
})

const embedUrl = computed(() => {
  if (!props.url) return ''
  // Use pdfjs or direct browser viewer with toolbar
  return `${props.url}#toolbar=1&navpanes=0&scrollbar=1`
})
</script>

<style lang="scss">
.resume-viewer {
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    background-color: var(--color-bg-body);
    border-bottom: 1px solid var(--color-border);
  }
  
  &__title-group {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-text-primary);
  }
  
  &__title {
    font-size: 14px;
    font-weight: 600;
  }
  
  &__actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  &__action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--color-text-secondary);
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    transition: all 0.2s;
    
    &:hover {
      color: var(--color-primary);
      background-color: var(--color-bg-hover);
    }
  }
  
  &__body {
    position: relative;
    width: 100%;
    min-height: 520px;
    display: flex;
  }
  
  &__frame-container {
    width: 100%;
    height: 580px;
    background-color: #525659;
  }
  
  &__iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }
  
  &__doc-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 60px 20px;
    width: 100%;
    text-align: center;
  }
  
  &__doc-icon {
    color: var(--color-primary);
  }
  
  &__doc-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  &__doc-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  
  &__doc-hint {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  
  &__doc-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }
  
  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    border-radius: var(--radius-md);
    transition: all 0.2s;
    
    &--primary {
      background-color: var(--color-primary);
      color: white;
      
      &:hover {
        background-color: var(--color-primary-hover);
      }
    }
    
    &--secondary {
      background-color: var(--color-bg-hover);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      
      &:hover {
        border-color: var(--color-primary);
      }
    }
  }
  
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px 20px;
    color: var(--color-text-secondary);
    text-align: center;
  }
  
  &__empty-text {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
}
</style>
