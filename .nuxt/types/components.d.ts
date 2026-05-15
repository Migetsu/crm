
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T

interface _GlobalComponents {
  CandidateAddModal: typeof import("../../app/components/candidates/CandidateAddModal/CandidateAddModal.vue")['default']
  CandidateCard: typeof import("../../app/components/candidates/CandidateCard/CandidateCard.vue")['default']
  CandidateSearch: typeof import("../../app/components/candidates/CandidateSearch/CandidateSearch.vue")['default']
  CandidateStatusModal: typeof import("../../app/components/candidates/CandidateStatusModal/CandidateStatusModal.vue")['default']
  AppHeader: typeof import("../../app/components/layout/AppHeader/AppHeader.vue")['default']
  AppSidebar: typeof import("../../app/components/layout/AppSidebar/AppSidebar.vue")['default']
  UiAccordion: typeof import("../../app/components/ui/UiAccordion/UiAccordion.vue")['default']
  UiButton: typeof import("../../app/components/ui/UiButton/UiButton.vue")['default']
  UiCheckbox: typeof import("../../app/components/ui/UiCheckbox/UiCheckbox.vue")['default']
  UiInput: typeof import("../../app/components/ui/UiInput/UiInput.vue")['default']
  UiModal: typeof import("../../app/components/ui/UiModal/UiModal.vue")['default']
  UiRadioGroup: typeof import("../../app/components/ui/UiRadioGroup/UiRadioGroup.vue")['default']
  UiSelect: typeof import("../../app/components/ui/UiSelect/UiSelect.vue")['default']
  NuxtWelcome: typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']
  NuxtLayout: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
  NuxtErrorBoundary: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
  ClientOnly: typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']
  DevOnly: typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']
  ServerPlaceholder: typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']
  NuxtLink: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']
  NuxtLoadingIndicator: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
  NuxtTime: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
  NuxtRouteAnnouncer: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
  NuxtImg: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
  NuxtPicture: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
  NuxtPage: typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']
  NoScript: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']
  Link: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']
  Base: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']
  Title: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']
  Meta: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']
  Style: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']
  Head: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']
  Html: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']
  Body: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']
  NuxtIsland: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']
  LazyCandidateAddModal: LazyComponent<typeof import("../../app/components/candidates/CandidateAddModal/CandidateAddModal.vue")['default']>
  LazyCandidateCard: LazyComponent<typeof import("../../app/components/candidates/CandidateCard/CandidateCard.vue")['default']>
  LazyCandidateSearch: LazyComponent<typeof import("../../app/components/candidates/CandidateSearch/CandidateSearch.vue")['default']>
  LazyCandidateStatusModal: LazyComponent<typeof import("../../app/components/candidates/CandidateStatusModal/CandidateStatusModal.vue")['default']>
  LazyAppHeader: LazyComponent<typeof import("../../app/components/layout/AppHeader/AppHeader.vue")['default']>
  LazyAppSidebar: LazyComponent<typeof import("../../app/components/layout/AppSidebar/AppSidebar.vue")['default']>
  LazyUiAccordion: LazyComponent<typeof import("../../app/components/ui/UiAccordion/UiAccordion.vue")['default']>
  LazyUiButton: LazyComponent<typeof import("../../app/components/ui/UiButton/UiButton.vue")['default']>
  LazyUiCheckbox: LazyComponent<typeof import("../../app/components/ui/UiCheckbox/UiCheckbox.vue")['default']>
  LazyUiInput: LazyComponent<typeof import("../../app/components/ui/UiInput/UiInput.vue")['default']>
  LazyUiModal: LazyComponent<typeof import("../../app/components/ui/UiModal/UiModal.vue")['default']>
  LazyUiRadioGroup: LazyComponent<typeof import("../../app/components/ui/UiRadioGroup/UiRadioGroup.vue")['default']>
  LazyUiSelect: LazyComponent<typeof import("../../app/components/ui/UiSelect/UiSelect.vue")['default']>
  LazyNuxtWelcome: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
  LazyNuxtLayout: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
  LazyNuxtErrorBoundary: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
  LazyClientOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']>
  LazyDevOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']>
  LazyServerPlaceholder: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
  LazyNuxtLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
  LazyNuxtLoadingIndicator: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
  LazyNuxtTime: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
  LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
  LazyNuxtImg: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
  LazyNuxtPicture: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
  LazyNuxtPage: LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']>
  LazyNoScript: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
  LazyLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']>
  LazyBase: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']>
  LazyTitle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']>
  LazyMeta: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']>
  LazyStyle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']>
  LazyHead: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']>
  LazyHtml: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']>
  LazyBody: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']>
  LazyNuxtIsland: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
