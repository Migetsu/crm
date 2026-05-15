<template lang="pug">
.candidate-search
  .candidate-search__fields
    .candidate-search__row(v-for="(field, idx) in searchFields", :key="idx")
      .candidate-search__input-wrapper
        Search.candidate-search__icon(:size="16")
        input.candidate-search__input(
          v-model="field.value",
          placeholder="Поиск по ФИО или телефону...",
          @input="debouncedSearch"
        )
        button.candidate-search__clear(v-if="field.value", @click="clearField(idx)")
          X(:size="14")
      button.candidate-search__remove(v-if="searchFields.length > 1", @click="removeField(idx)")
        Trash2(:size="14")
        
  button.candidate-search__add(@click="addField")
    Plus(:size="14")
    | Добавить поле
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Search, X, Plus, Trash2 } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'search', query: string): void
}>()

const searchFields = reactive([{ value: '' }])
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const debouncedSearch = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    // OR logic: combine all field values
    const queries = searchFields
      .map(f => f.value.trim())
      .filter(Boolean)
    emit('search', queries.join(' '))
  }, 300)
}

const addField = () => {
  searchFields.push({ value: '' })
}

const removeField = (idx: number) => {
  searchFields.splice(idx, 1)
  debouncedSearch()
}

const clearField = (idx: number) => {
  searchFields[idx].value = ''
  debouncedSearch()
}
</script>

<style lang="scss">
.candidate-search {
  margin-bottom: var(--spacing-4);
  
  &__fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  &__input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }
  
  &__icon {
    position: absolute;
    left: 12px;
    color: var(--color-text-secondary);
  }
  
  &__input {
    width: 100%;
    padding: 10px 36px 10px 36px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 14px;
    transition: border-color 0.2s;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
    
    &::placeholder {
      color: var(--color-text-secondary);
      opacity: 0.7;
    }
  }
  
  &__clear {
    position: absolute;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    color: var(--color-text-secondary);
    transition: all 0.2s;
    
    &:hover {
      background-color: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
  }
  
  &__remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    color: var(--color-danger);
    transition: all 0.2s;
    
    &:hover {
      background-color: rgba(239, 68, 68, 0.1);
    }
  }
  
  &__add {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    margin-top: 4px;
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    font-size: 13px;
    transition: all 0.2s;
    
    &:hover {
      background-color: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
  }
}
</style>
