<template lang="pug">
label.ui-checkbox
  input.ui-checkbox__input(
    type="checkbox",
    :checked="modelValue",
    @change="handleChange"
  )
  span.ui-checkbox__box
    Check.ui-checkbox__icon(:size="14")
  span.ui-checkbox__text(v-if="label") {{ label }}
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'

const props = defineProps<{
  modelValue?: boolean
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const handleChange = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>

<style lang="scss">
.ui-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  &__input {
    display: none;
    
    &:checked + .ui-checkbox__box {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      
      .ui-checkbox__icon {
        opacity: 1;
        transform: scale(1);
      }
    }
  }
  
  &__box {
    width: 18px;
    height: 18px;
    border: 2px solid var(--color-border);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  
  &__icon {
    color: white;
    opacity: 0;
    transform: scale(0);
    transition: all 0.2s;
  }
  
  &__text {
    font-size: 14px;
    color: var(--color-text-primary);
  }
}
</style>
