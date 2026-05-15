<template lang="pug">
.ui-input(:class="{ 'ui-input--error': !!error }")
  label.ui-input__label(v-if="label") {{ label }}
  .ui-input__wrapper
    span.ui-input__prefix(v-if="$slots.prefix")
      slot(name="prefix")
    input.ui-input__field(
      :type="type",
      :value="modelValue",
      :placeholder="placeholder",
      :disabled="disabled",
      :required="required",
      @input="handleInput"
    )
    span.ui-input__suffix(v-if="$slots.suffix")
      slot(name="suffix")
  span.ui-input__error(v-if="error") {{ error }}
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  type?: string
  error?: string
  disabled?: boolean
  required?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const handleInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<style lang="scss">
.ui-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  
  &__wrapper {
    display: flex;
    align-items: center;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition: border-color 0.2s, box-shadow 0.2s;
    
    &:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }
  }
  
  &__prefix,
  &__suffix {
    display: flex;
    align-items: center;
    padding: 0 10px;
    color: var(--color-text-secondary);
  }
  
  &__field {
    flex: 1;
    padding: 10px 12px;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-size: 14px;
    outline: none;
    min-width: 0;
    
    &::placeholder {
      color: var(--color-text-secondary);
      opacity: 0.7;
    }
  }
  
  &--error {
    .ui-input__wrapper {
      border-color: var(--color-danger);
    }
  }
  
  &__error {
    font-size: 12px;
    color: var(--color-danger);
  }
}
</style>
