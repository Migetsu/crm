<template lang="pug">
.ui-file-upload(:class="{ 'ui-file-upload--drag-over': isDragOver, 'ui-file-upload--error': !!errorMessage, 'ui-file-upload--disabled': disabled }")
  label.ui-file-upload__label(v-if="label") {{ label }}
  
  .ui-file-upload__zone(
    @dragover.prevent="handleDragOver",
    @dragleave.prevent="handleDragLeave",
    @drop.prevent="handleDrop"
  )
    input.ui-file-upload__input(
      v-if="!selectedFile",
      ref="fileInputRef",
      type="file",
      :accept="accept",
      :disabled="disabled || isUploading",
      @change="handleFileChange"
    )
    
    .ui-file-upload__loading(v-if="isUploading")
      .ui-file-upload__spinner
      span.ui-file-upload__loading-text Загрузка файла...
      
    .ui-file-upload__content(v-else-if="!selectedFile")
      .ui-file-upload__icon-box
        UploadCloud(:size="28")
      .ui-file-upload__text-group
        span.ui-file-upload__prompt
          strong Нажмите для выбора
          |  или перетащите файл
        span.ui-file-upload__hint PDF, DOCX, DOC или изображения до {{ maxMb }} МБ
        
    .ui-file-upload__file(v-else, @click.stop)
      .ui-file-upload__file-icon
        FileText(:size="24")
      .ui-file-upload__file-info
        span.ui-file-upload__file-name {{ selectedFile.name }}
        span.ui-file-upload__file-size {{ formattedSelectedFileSize }}
      button.ui-file-upload__remove-btn(type="button", title="Удалить файл", @click.stop="clearFile")
        X(:size="16")
        
  span.ui-file-upload__error(v-if="errorMessage") {{ errorMessage }}
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UploadCloud, FileText, X } from 'lucide-vue-next'
import { validateFile, formatFileSize, MAX_RESUME_SIZE, ALLOWED_RESUME_EXTENSIONS } from '~/utils/file-validation'

const props = withDefaults(
  defineProps<{
    label?: string
    accept?: string
    maxSize?: number
    disabled?: boolean
    isUploading?: boolean
    error?: string
  }>(),
  {
    label: '',
    accept: '.pdf,.docx,.doc,.png,.jpg,.jpeg',
    maxSize: MAX_RESUME_SIZE,
    disabled: false,
    isUploading: false,
    error: '',
  },
)

const emit = defineEmits<{
  (e: 'file-selected', file: File | null): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const selectedFile = ref<File | null>(null)
const localError = ref('')

const maxMb = computed(() => Math.round(props.maxSize / (1024 * 1024)))
const errorMessage = computed(() => props.error || localError.value)

const formattedSelectedFileSize = computed(() => {
  return selectedFile.value ? formatFileSize(selectedFile.value.size) : ''
})

const processFile = (file: File) => {
  localError.value = ''
  const validation = validateFile(file, props.maxSize)
  if (!validation.valid) {
    localError.value = validation.error || 'Неверный файл'
    selectedFile.value = null
    emit('file-selected', null)
    return
  }

  selectedFile.value = file
  emit('file-selected', file)
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleDragOver = () => {
  if (props.disabled || props.isUploading) return
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (e: DragEvent) => {
  isDragOver.value = false
  if (props.disabled || props.isUploading) return

  const file = e.dataTransfer?.files?.[0]
  if (file) {
    processFile(file)
  }
}

const clearFile = () => {
  selectedFile.value = null
  localError.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  emit('file-selected', null)
}

defineExpose({
  clearFile,
})
</script>

<style lang="scss">
.ui-file-upload {
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  
  &__zone {
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-bg-body);
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    min-height: 110px;
    
    &:hover {
      border-color: var(--color-primary);
      background-color: var(--color-bg-hover);
    }
  }
  
  &--drag-over &__zone {
    border-color: var(--color-primary);
    background-color: rgba(59, 130, 246, 0.08);
    transform: scale(1.01);
  }
  
  &--error &__zone {
    border-color: var(--color-danger);
  }
  
  &--disabled &__zone {
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover {
      border-color: var(--color-border);
      background-color: var(--color-bg-body);
    }
  }
  
  &__input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 2;
  }
  
  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }
  
  &__icon-box {
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  &__text-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  &__prompt {
    font-size: 14px;
    color: var(--color-text-primary);
    
    strong {
      color: var(--color-primary);
    }
  }
  
  &__hint {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
  
  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--color-primary);
  }
  
  &__spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(59, 130, 246, 0.2);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  &__loading-text {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  
  &__file {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 12px;
    padding: 10px 14px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }
  
  &__file-icon {
    color: var(--color-primary);
    display: flex;
    align-items: center;
  }
  
  &__file-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  
  &__file-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__file-size {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
  
  &__remove-btn {
    color: var(--color-text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    
    &:hover {
      color: var(--color-danger);
    }
  }
  
  &__error {
    font-size: 12px;
    color: var(--color-danger);
  }
}
</style>
