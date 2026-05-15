<template lang="pug">
.ui-select(:class="{ 'ui-select--error': !!error, 'ui-select--open': isOpen }")
  label.ui-select__label(v-if="label") {{ label }}
  .ui-select__trigger(@click="toggle", ref="triggerRef")
    span.ui-select__value(:class="{ 'ui-select__value--placeholder': !modelValue }")
      | {{ displayValue }}
    ChevronDown.ui-select__icon(:size="16")
    
  Teleport(to="body")
    .ui-select__dropdown(v-if="isOpen", :style="dropdownStyle", ref="dropdownRef")
      .ui-select__search(v-if="searchable")
        input.ui-select__search-input(
          v-model="searchQuery",
          placeholder="Поиск...",
          ref="searchInputRef",
          @click.stop
        )
      .ui-select__options
        .ui-select__option(
          v-for="option in filteredOptions",
          :key="option.value",
          :class="{ 'ui-select__option--selected': option.value === modelValue }",
          @click.stop="selectOption(option.value)"
        )
          | {{ option.label }}
        .ui-select__empty(v-if="filteredOptions.length === 0") Ничего не найдено
  
  span.ui-select__error(v-if="error") {{ error }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

export interface SelectOption {
  value: string
  label: string
}

const props = defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  options: SelectOption[]
  error?: string
  searchable?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const displayValue = computed(() => {
  if (!props.modelValue) return props.placeholder || 'Выберите...'
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt ? opt.label : props.modelValue
})

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const q = searchQuery.value.toLowerCase()
  return props.options.filter(o => o.label.toLowerCase().includes(q))
})

const toggle = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      updatePosition()
      searchInputRef.value?.focus()
    })
  } else {
    searchQuery.value = ''
  }
}

const selectOption = (value: string) => {
  emit('update:modelValue', value)
  isOpen.value = false
  searchQuery.value = ''
}

const updatePosition = () => {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: '9999',
  }
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node
  if (
    triggerRef.value && !triggerRef.value.contains(target) &&
    dropdownRef.value && !dropdownRef.value.contains(target)
  ) {
    isOpen.value = false
    searchQuery.value = ''
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss">
.ui-select {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  
  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  
  &__trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: border-color 0.2s;
    
    &:hover {
      border-color: var(--color-primary);
    }
  }
  
  &__value {
    font-size: 14px;
    color: var(--color-text-primary);
    
    &--placeholder {
      color: var(--color-text-secondary);
      opacity: 0.7;
    }
  }
  
  &__icon {
    color: var(--color-text-secondary);
    transition: transform 0.2s;
  }
  
  &--open &__icon {
    transform: rotate(180deg);
  }
  
  &__dropdown {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    max-height: 240px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  &__search {
    padding: 8px;
    border-bottom: 1px solid var(--color-border);
    
    &-input {
      width: 100%;
      padding: 6px 8px;
      background-color: var(--color-bg-body);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-text-primary);
      font-size: 14px;
      outline: none;
      
      &:focus {
        border-color: var(--color-primary);
      }
    }
  }
  
  &__options {
    overflow-y: auto;
    max-height: 200px;
  }
  
  &__option {
    padding: 8px 12px;
    font-size: 14px;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: background-color 0.15s;
    
    &:hover {
      background-color: var(--color-bg-hover);
    }
    
    &--selected {
      background-color: rgba(59, 130, 246, 0.1);
      color: var(--color-primary);
    }
  }
  
  &__empty {
    padding: 16px;
    text-align: center;
    color: var(--color-text-secondary);
    font-size: 14px;
  }
  
  &--error &__trigger {
    border-color: var(--color-danger);
  }
  
  &__error {
    font-size: 12px;
    color: var(--color-danger);
  }
}
</style>
