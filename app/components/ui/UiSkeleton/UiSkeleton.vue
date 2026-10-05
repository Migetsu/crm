<template lang="pug">
.ui-skeleton(:class="variantClass", :style="customStyle", aria-hidden="true")
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    width?: string | number
    height?: string | number
    borderRadius?: string
    variant?: 'text' | 'rect' | 'circle'
  }>(),
  {
    width: '100%',
    height: '16px',
    borderRadius: undefined,
    variant: 'rect',
  }
)

const variantClass = computed(() => `ui-skeleton--${props.variant}`)

const customStyle = computed(() => {
  const formatSize = (val: string | number | undefined) => {
    if (val === undefined) return undefined
    return typeof val === 'number' ? `${val}px` : val
  }

  const style: Record<string, string | undefined> = {
    width: formatSize(props.width),
    height: formatSize(props.height),
  }

  if (props.borderRadius) {
    style.borderRadius = props.borderRadius
  }

  return style
})
</script>

<style lang="scss">
.ui-skeleton {
  background-color: var(--color-bg-hover);
  position: relative;
  overflow: hidden;
  display: block;

  &--rect {
    border-radius: var(--radius-md);
  }

  &--text {
    border-radius: var(--radius-sm);
    margin-bottom: 4px;
    height: 14px;
  }

  &--circle {
    border-radius: var(--radius-full);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.08) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    animation: ui-skeleton-shimmer 1.5s infinite ease-in-out;
  }
}

:root[data-theme="light"] .ui-skeleton::after {
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.05) 50%,
    rgba(0, 0, 0, 0) 100%
  );
}

@keyframes ui-skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
