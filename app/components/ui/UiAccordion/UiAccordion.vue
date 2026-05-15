<template lang="pug">
.ui-accordion
  button.ui-accordion__header(@click="toggle", :class="{ 'ui-accordion__header--collapsed': isCollapsed }")
    span.ui-accordion__title(v-if="!isCollapsed") {{ title }}
    ChevronDown.ui-accordion__icon(:class="{ 'ui-accordion__icon--open': isOpen }", :size="16", v-if="!isCollapsed")
    
  //- Анимация раскрытия
  transition(
    name="accordion",
    @enter="enter",
    @after-enter="afterEnter",
    @leave="leave"
  )
    .ui-accordion__content(v-show="isOpen || isCollapsed")
      .ui-accordion__inner
        slot
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  initiallyOpen?: boolean
  isCollapsed?: boolean // sidebar collapsed state
}>()

const isOpen = ref(props.initiallyOpen || false)

const toggle = () => {
  if (props.isCollapsed) return // ignore if sidebar collapsed
  isOpen.value = !isOpen.value
}

// Transitions for smooth height toggle
const enter = (el: Element) => {
  const HTMLElement = el as HTMLElement
  HTMLElement.style.height = '0'
  HTMLElement.style.height = HTMLElement.scrollHeight + 'px'
}

const afterEnter = (el: Element) => {
  const HTMLElement = el as HTMLElement
  HTMLElement.style.height = 'auto'
}

const leave = (el: Element) => {
  const HTMLElement = el as HTMLElement
  HTMLElement.style.height = HTMLElement.scrollHeight + 'px'
  // Force repaint
  HTMLElement.offsetHeight
  HTMLElement.style.height = '0'
}
</script>

<style lang="scss">
@use './UiAccordion.scss';
</style>
