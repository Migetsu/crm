<template lang="pug">
.page-analytics
  //- Header with Actions
  .page-analytics__header
    .page-analytics__headline
      h1.page-title Аналитика и воронка найма
      p.page-analytics__subtitle Показатели конверсии, эффективность источников и скорость закрытия вакансий

    .page-analytics__actions
      UiButton(variant="secondary", size="sm", @click="handleExportCandidates", :disabled="analyticsStore.isLoading")
        template(#icon)
          Download(:size="16")
        | Выгрузить кандидатов (CSV)

      UiButton(variant="primary", size="sm", @click="handleExportReport", :disabled="analyticsStore.isLoading")
        template(#icon)
          FileSpreadsheet(:size="16")
        | Отчёт по воронке (CSV)

  //- Filter Bar
  .page-analytics__filter-bar
    .page-analytics__filter-item
      label.page-analytics__filter-label Период
      UiSelect(
        v-model="analyticsStore.filter.period",
        :options="periodOptions"
      )

    .page-analytics__filter-item
      label.page-analytics__filter-label Вакансия
      UiSelect(
        v-model="analyticsStore.filter.vacancyId",
        :options="vacancyOptions",
        placeholder="Все вакансии",
        searchable
      )

    .page-analytics__filter-item
      label.page-analytics__filter-label Подразделение / Филиал
      UiSelect(
        v-model="analyticsStore.filter.orgUnitId",
        :options="orgUnitOptions",
        placeholder="Все филиалы",
        searchable
      )

    .page-analytics__filter-item
      label.page-analytics__filter-label Источник
      UiSelect(
        v-model="analyticsStore.filter.source",
        :options="sourceOptions",
        placeholder="Все источники"
      )

  //- Skeleton Loaders
  template(v-if="analyticsStore.isLoading")
    .analytics-kpis
      .analytics-kpi(v-for="i in 4", :key="i")
        UiSkeleton(width="110px", height="14px", style="margin-bottom: 8px;")
        UiSkeleton(width="70px", height="28px", style="margin-bottom: 6px;")
        UiSkeleton(width="140px", height="12px")

    .analytics-card(style="margin-top: 24px;")
      UiSkeleton(width="200px", height="20px", style="margin-bottom: 20px;")
      .analytics-card__skeleton-rows(style="display: flex; flex-direction: column; gap: 16px;")
        UiSkeleton(v-for="i in 5", :key="i", width="100%", height="54px", border-radius="8px")

  //- Loaded Content
  template(v-else)
    //- Empty State
    .page-analytics__empty(v-if="summary.totalCandidates === 0")
      BarChart3(:size="48")
      h3 Нет данных за выбранный период
      p Попробуйте изменить фильтры периода, вакансии или подразделения

    template(v-else)
      //- KPI Cards Row
      .analytics-kpis
        .analytics-kpi
          .analytics-kpi__header
            span.analytics-kpi__title Кандидатов в выборке
            Users.analytics-kpi__icon(:size="18")
          .analytics-kpi__value {{ summary.totalCandidates }}
          span.analytics-kpi__hint За период: {{ analyticsStore.getPeriodLabel }}

        .analytics-kpi
          .analytics-kpi__header
            span.analytics-kpi__title Принято на работу
            UserCheck.analytics-kpi__icon.analytics-kpi__icon--success(:size="18")
          .analytics-kpi__value.analytics-kpi__value--success {{ summary.hiredCount }}
          span.analytics-kpi__hint Успешно закрытых вакансий

        .analytics-kpi
          .analytics-kpi__header
            span.analytics-kpi__title Конверсия в наём
            TrendingUp.analytics-kpi__icon.analytics-kpi__icon--primary(:size="18")
          .analytics-kpi__value.analytics-kpi__value--primary {{ summary.overallConversion }}%
          span.analytics-kpi__hint Отношение принятых к общему пулу

        .analytics-kpi
          .analytics-kpi__header
            span.analytics-kpi__title Скорость найма (Time-to-Hire)
            Clock.analytics-kpi__icon.analytics-kpi__icon--warning(:size="18")
          .analytics-kpi__value.analytics-kpi__value--warning {{ summary.timeToHire.avgDaysToHire }} дн.
          span.analytics-kpi__hint Среднее время от отклика до оффера

      //- Funnel Section
      .analytics-card
        .analytics-card__header
          .analytics-card__title-box
            h2.analytics-card__title Воронка подбора кандидатов
            p.analytics-card__desc Прохождение кандидатов по ключевым этапам рекрутинга
          .analytics-card__badge-total Всего: {{ summary.totalCandidates }} кандидатов

        .analytics-funnel
          .analytics-funnel__row(
            v-for="(stage, idx) in summary.funnel",
            :key="stage.id"
          )
            .analytics-funnel__stage-info
              .analytics-funnel__stage-header
                span.analytics-funnel__index {{ idx + 1 }}
                span.analytics-funnel__name {{ stage.label }}
              .analytics-funnel__stage-counts
                strong.analytics-funnel__count {{ stage.count }} чел.
                span.analytics-funnel__pct-total {{ stage.conversionTotal }}% от входа

            .analytics-funnel__bar-container
              .analytics-funnel__bar(
                :style="{ width: `${Math.max(4, stage.conversionTotal)}%`, backgroundColor: stage.color }"
              )
                span.analytics-funnel__bar-text(v-if="stage.conversionTotal >= 15") {{ stage.conversionTotal }}%

            .analytics-funnel__step-conversion(v-if="idx > 0")
              ArrowDownRight(:size="14")
              span {{ stage.conversionStep }}% переход с пред. этапа

      //- 2-Column Grid: Sources & Time-to-Hire / Rejections
      .analytics-grid
        //- Sources Efficiency
        .analytics-card
          .analytics-card__header
            .analytics-card__title-box
              h2.analytics-card__title Эффективность источников
              p.analytics-card__desc Сравнение каналов привлечения кандидатов
            Share2.analytics-card__icon(:size="18")

          .analytics-sources
            .analytics-sources__item(v-for="s in summary.sources", :key="s.source")
              .analytics-sources__info
                .analytics-sources__title-row
                  span.analytics-sources__name {{ s.label }}
                  span.analytics-sources__share {{ s.share }}% трафика ({{ s.total }} чел.)
                .analytics-sources__metrics-row
                  span.analytics-sources__metric
                    | Интервью: 
                    strong {{ s.interviews }}
                  span.analytics-sources__metric-dot ·
                  span.analytics-sources__metric
                    | Нанято: 
                    strong {{ s.hired }}
                  span.analytics-sources__metric-dot ·
                  span.analytics-sources__conversion
                    | Конверсия в наём: 
                    strong {{ s.conversionToHire }}%

              .analytics-sources__progress
                .analytics-sources__progress-bar(
                  :style="{ width: `${Math.max(5, s.conversionToHire)}%` }"
                )

        //- Speed & Rejections
        .analytics-card
          .analytics-card__header
            .analytics-card__title-box
              h2.analytics-card__title Скорость найма и отказы
              p.analytics-card__desc Время цикла подбора и причины нестыковок
            Sliders(:size="18")

          //- Time-to-Hire Stats Cards
          .analytics-speed
            .analytics-speed__item
              span.analytics-speed__label До собеседования
              strong.analytics-speed__value {{ summary.timeToHire.avgDaysToInterview }} дн.
            .analytics-speed__item
              span.analytics-speed__label Средний Time-to-Hire
              strong.analytics-speed__value.analytics-speed__value--highlight {{ summary.timeToHire.avgDaysToHire }} дн.
            .analytics-speed__item
              span.analytics-speed__label Быстрее всего
              strong.analytics-speed__value {{ summary.timeToHire.minDaysToHire }} дн.

          //- Rejections Breakdown
          .analytics-rejections
            h3.analytics-rejections__title Топ причин отказов соискателей
            .analytics-rejections__empty(v-if="summary.rejections.length === 0")
              p Отказов в выбранном периоде нет
            .analytics-rejections__list(v-else)
              .analytics-rejections__item(v-for="r in summary.rejections", :key="r.reason")
                .analytics-rejections__info
                  span.analytics-rejections__name {{ r.label }}
                  span.analytics-rejections__count {{ r.count }} чел. ({{ r.share }}%)
                .analytics-rejections__bar
                  .analytics-rejections__fill(:style="{ width: `${r.share}%` }")
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  Download, FileSpreadsheet, Users, UserCheck, TrendingUp, Clock,
  BarChart3, ArrowDownRight, Share2, Sliders
} from 'lucide-vue-next'
import { useAnalyticsStore } from '~/stores/analytics.store'
import { useToast } from '~/composables/useToast'
import UiButton from '~/components/ui/UiButton/UiButton.vue'
import UiSelect from '~/components/ui/UiSelect/UiSelect.vue'
import UiSkeleton from '~/components/ui/UiSkeleton/UiSkeleton.vue'

const analyticsStore = useAnalyticsStore()
const toast = useToast()

const summary = computed(() => analyticsStore.summary)

const periodOptions = [
  { value: 'all', label: 'Всё время' },
  { value: '7d', label: 'Последние 7 дней' },
  { value: '30d', label: 'Последние 30 дней' },
  { value: '90d', label: 'Квартал (90 дней)' },
  { value: 'year', label: 'Последний год' },
]

const vacancyOptions = computed(() => [
  { value: '', label: 'Все вакансии' },
  ...analyticsStore.vacancies.map(v => ({ value: v.id, label: v.title })),
])

const orgUnitOptions = computed(() => [
  { value: '', label: 'Все подразделения' },
  ...analyticsStore.orgUnits.map(u => ({ value: u.id, label: u.name })),
])

const sourceOptions = [
  { value: '', label: 'Все источники' },
  { value: 'hh', label: 'HeadHunter (HH.ru)' },
  { value: 'avito', label: 'Авито' },
]

onMounted(async () => {
  await analyticsStore.fetchAllData()
})

const handleExportCandidates = () => {
  if (summary.value.totalCandidates === 0) {
    toast.warning('Нет кандидатов для выгрузки по текущим фильтрам')
    return
  }
  analyticsStore.exportCandidates()
  toast.success('Список кандидатов успешно выгружен в CSV')
}

const handleExportReport = () => {
  if (summary.value.totalCandidates === 0) {
    toast.warning('Нет данных для формирования отчёта')
    return
  }
  analyticsStore.exportFunnelReport()
  toast.success('Отчёт по воронке подбора успешно сформирован и скачан')
}
</script>

<style lang="scss">
.page-analytics {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-6);
    flex-wrap: wrap;
    gap: 16px;
  }

  &__headline {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__subtitle {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  &__actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__filter-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 16px 20px;
    margin-bottom: var(--spacing-6);

    @media (max-width: 900px) {
      grid-template-columns: 1fr 1fr;
    }

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }

  &__filter-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__filter-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 24px;
    background-color: var(--color-bg-card);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-lg);
    color: var(--color-text-secondary);
    gap: 12px;
    text-align: center;

    h3 {
      font-size: 18px;
      color: var(--color-text-primary);
      margin: 0;
    }

    p {
      font-size: 14px;
      margin: 0;
    }
  }
}

// KPI Widgets
.analytics-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: var(--spacing-6);

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.analytics-kpi {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &__title {
    font-size: 13px;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  &__icon {
    color: var(--color-text-secondary);

    &--success { color: var(--color-success); }
    &--primary { color: var(--color-primary); }
    &--warning { color: var(--color-warning); }
  }

  &__value {
    font-size: 26px;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.2;
    margin-bottom: 4px;

    &--success { color: var(--color-success); }
    &--primary { color: var(--color-primary); }
    &--warning { color: var(--color-warning); }
  }

  &__hint {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
}

// Card Wrapper
.analytics-card {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: var(--spacing-6);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    gap: 16px;
  }

  &__title-box {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  &__desc {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0;
  }

  &__badge-total {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-primary);
    background-color: rgba(59, 130, 246, 0.12);
    padding: 6px 14px;
    border-radius: var(--radius-full);
  }

  &__icon {
    color: var(--color-text-secondary);
  }
}

// Funnel Section
.analytics-funnel {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__row {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__stage-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__stage-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__index {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background-color: var(--color-bg-hover);
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__stage-counts {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__count {
    font-size: 15px;
    color: var(--color-text-primary);
  }

  &__pct-total {
    font-size: 13px;
    color: var(--color-text-secondary);
    background-color: var(--color-bg-hover);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
  }

  &__bar-container {
    height: 28px;
    background-color: var(--color-bg-hover);
    border-radius: var(--radius-md);
    overflow: hidden;
    position: relative;
  }

  &__bar {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;
    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    border-radius: var(--radius-md);
  }

  &__bar-text {
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  &__step-conversion {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-text-secondary);
    padding-left: 32px;
  }
}

// 2-Column Grid
.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

// Sources Section
.analytics-sources {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  &__title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__share {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  &__metrics-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--color-text-secondary);
    flex-wrap: wrap;

    strong {
      color: var(--color-text-primary);
    }
  }

  &__conversion strong {
    color: var(--color-success);
  }

  &__progress {
    height: 6px;
    background-color: var(--color-bg-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  &__progress-bar {
    height: 100%;
    background-color: var(--color-success);
    border-radius: var(--radius-full);
  }
}

// Speed & Rejections
.analytics-speed {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;

  &__item {
    background-color: var(--color-bg-body);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }

  &__label {
    font-size: 11px;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__value {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-primary);

    &--highlight {
      color: var(--color-primary);
    }
  }
}

.analytics-rejections {
  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 12px 0;
  }

  &__empty {
    font-size: 13px;
    color: var(--color-text-secondary);
    font-style: italic;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__info {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
  }

  &__name {
    color: var(--color-text-primary);
  }

  &__count {
    color: var(--color-danger);
    font-weight: 500;
  }

  &__bar {
    height: 6px;
    background-color: var(--color-bg-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background-color: var(--color-danger);
    border-radius: var(--radius-full);
  }
}
</style>
