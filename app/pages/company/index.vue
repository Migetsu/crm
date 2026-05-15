<template lang="pug">
.page-company
  h1.page-title Моя компания
  .company-card
    .company-card__header
      .company-card__logo
      .company-card__info
        h2.company-card__name ООО «РекрутПро»
        p.company-card__slogan Находим лучших — быстро и точно
    .company-card__section
      h3 О компании
      p РекрутПро — современная платформа для автоматизации процессов подбора персонала. Мы помогаем компаниям находить лучших кандидатов быстро и эффективно, используя передовые технологии и проверенные методики рекрутинга.
    .company-card__section
      h3 Контакты HR-отдела
      .company-card__contacts
        .company-card__contact
          span.company-card__contact-label Email
          span hr@rekrutpro.ru
        .company-card__contact
          span.company-card__contact-label Телефон
          span +7 (495) 123-45-67
        .company-card__contact
          span.company-card__contact-label Адрес
          span Москва, ул. Тверская, 1, офис 401
    .company-card__section
      h3 Реквизиты
      .company-card__contacts
        .company-card__contact
          span.company-card__contact-label ИНН
          span 7701234567
        .company-card__contact
          span.company-card__contact-label ОГРН
          span 1177700000001
        .company-card__contact
          span.company-card__contact-label КПП
          span 770101001
</template>

<script setup lang="ts">
</script>

<style lang="scss">
.page-company {
  .page-title { margin-bottom: var(--spacing-6); }
}

.company-card {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  
  &__header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 32px 24px;
    border-bottom: 1px solid var(--color-border);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05));
  }
  
  &__logo {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
    flex-shrink: 0;
  }
  
  &__name {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  
  &__slogan {
    font-size: 16px;
    color: var(--color-text-secondary);
  }
  
  &__section {
    padding: 24px;
    border-bottom: 1px solid var(--color-border);
    
    &:last-child { border-bottom: none; }
    
    h3 {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-secondary);
      margin-bottom: 12px;
    }
    
    p {
      font-size: 14px;
      line-height: 1.7;
      color: var(--color-text-primary);
    }
  }
  
  &__contacts {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  &__contact {
    display: flex;
    gap: 12px;
    font-size: 14px;
    
    &-label {
      min-width: 80px;
      color: var(--color-text-secondary);
    }
  }
}
</style>
