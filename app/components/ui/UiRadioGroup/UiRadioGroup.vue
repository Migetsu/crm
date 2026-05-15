<template lang="pug">
.ui-radio-group
  label.ui-radio-group__label(v-if="label") {{ label }}
  .ui-radio-group__options
    label.ui-radio-group__option(v-for="option in options", :key="option.value")
      input.ui-radio-group__input(
        type="radio",
        :name="name",
        :value="option.value",
        :checked="option.value === modelValue",
        @change="$emit('update:modelValue', option.value)"
      )
      span.ui-radio-group__radio
      span.ui-radio-group__text {{ option.label }}
  span.ui-radio-group__error(v-if="error") {{ error }}
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string
  label?: string
  name: string
  options: { value: string; label: string }[]
  error?: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<style lang="scss">
.ui-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  
  &__options {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  &__option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: var(--color-text-primary);
  }
  
  &__input {
    display: none;
    
    &:checked + .ui-radio-group__radio {
      border-color: var(--color-primary);
      
      &::after {
        transform: scale(1);
      }
    }
  }
  
  &__radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--color-border);
    position: relative;
    transition: border-color 0.2s;
    flex-shrink: 0;
    
    &::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--color-primary);
      transform: scale(0);
      transition: transform 0.2s;
    }
  }
  
  &__error {
    font-size: 12px;
    color: var(--color-danger);
  }
}
</style>
