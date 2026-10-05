<template lang="pug">
//- Kanban Card Skeleton
.candidate-kanban__card.candidate-card-skeleton(v-if="variant === 'kanban'", aria-hidden="true")
  .candidate-kanban__card-header
    UiSkeleton(width="70%", height="16px")
    UiSkeleton(width="18px", height="18px", border-radius="4px")
  .candidate-kanban__card-meta(style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;")
    UiSkeleton(width="55%", height="12px")
    UiSkeleton(width="80%", height="12px")
  .candidate-kanban__card-footer(style="margin-top: 10px; display: flex; justify-content: space-between;")
    UiSkeleton(width="35%", height="11px")
    UiSkeleton(width="25%", height="11px")

//- Grid Card Skeleton
article.candidate-grid-card.candidate-card-skeleton(v-else-if="variant === 'grid'", aria-hidden="true")
  .candidate-grid-card__header
    UiSkeleton(width="40px", height="40px", border-radius="50%", variant="circle")
    .candidate-grid-card__header-right(style="display: flex; gap: 6px; align-items: center;")
      UiSkeleton(width="80px", height="20px", border-radius="12px")
      UiSkeleton(width="28px", height="28px", border-radius="6px")
  .candidate-grid-card__body(style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;")
    UiSkeleton(width="80%", height="16px")
    UiSkeleton(width="60%", height="18px", border-radius="4px")
    .candidate-grid-card__contacts(style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;")
      UiSkeleton(width="65%", height="12px")
      UiSkeleton(width="85%", height="12px")
  .candidate-grid-card__footer(style="margin-top: 8px; display: flex; flex-direction: column; gap: 10px;")
    UiSkeleton(width="50%", height="12px")
    UiSkeleton(width="100%", height="32px", border-radius="6px")

//- List Card Skeleton
article.candidate-card.candidate-card-skeleton(v-else, aria-hidden="true")
  .candidate-card__left
    UiSkeleton(width="48px", height="48px", border-radius="50%", variant="circle")
    .candidate-card__info(style="display: flex; flex-direction: column; gap: 8px;")
      UiSkeleton(width="200px", height="18px")
      .candidate-card__meta(style="display: flex; gap: 12px;")
        UiSkeleton(width="110px", height="14px")
        UiSkeleton(width="130px", height="14px")
  .candidate-card__right(style="display: flex; align-items: center; gap: 16px;")
    UiSkeleton(width="110px", height="24px", border-radius="4px")
    UiSkeleton(width="80px", height="14px")
    UiSkeleton(width="120px", height="32px", border-radius="6px")
</template>

<script setup lang="ts">
import UiSkeleton from '~/components/ui/UiSkeleton/UiSkeleton.vue'

withDefaults(
  defineProps<{
    variant?: 'list' | 'kanban' | 'grid'
  }>(),
  {
    variant: 'list',
  }
)
</script>

<style lang="scss">
.candidate-card-skeleton {
  pointer-events: none;
}
</style>
