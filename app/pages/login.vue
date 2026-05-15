<template lang="pug">
.auth-layout
  .auth-layout__visual
    .auth-layout__visual-bg
    .auth-layout__visual-content
      h2.auth-layout__visual-title РекрутПро CRM
      p.auth-layout__visual-subtitle Интеллектуальный подбор и аналитика в единой системе
      
      .auth-layout__visual-cards
        .auth-card(v-for="i in 3" :key="i" :class="`auth-card--${i}`")
          .auth-card__avatar
          .auth-card__lines
            .auth-card__line
            .auth-card__line
          
  .auth-layout__form
    .login-container
      .login-header
        h1.login-header__title Вход в систему
        p.login-header__subtitle Введите ваши данные для доступа к платформе
        
      .login-error(v-if="authStore.error")
        span {{ authStore.error }}
        
      form.login-form(@submit.prevent="handleLogin")
        .login-form__group
          label.login-form__label Email
          input.login-form__input(type="email", v-model="email", required, placeholder="mail@crm.ru", :disabled="authStore.isLoading")
          
        .login-form__group
          label.login-form__label Пароль
          input.login-form__input(type="password", v-model="password", required, placeholder="••••••••", :disabled="authStore.isLoading")
          
        UiButton(variant="primary", size="lg", :disabled="authStore.isLoading").login-form__submit 
          | {{ authStore.isLoading ? 'Авторизация...' : 'Войти в CRM' }}
          
      .login-hints
        h3 Быстрый вход (пароль: 12345):
        .login-hints__grid
          button.login-hint-item(
            v-for="hint in hints",
            :key="hint.email",
            @click="quickLogin(hint.email)",
            :disabled="authStore.isLoading",
            type="button"
          )
            .login-hint-item__role {{ hint.role }}
            .login-hint-item__email {{ hint.email }}
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth.store'
import { gsap } from 'gsap'

definePageMeta({ layout: false })

const email = ref('')
const password = ref('')
const authStore = useAuthStore()
const router = useRouter()

const hints = [
  { role: 'Супер Админ', email: 'superadmin@crm.ru' },
  { role: 'Администратор', email: 'admin@crm.ru' },
  { role: 'Директор', email: 'director@crm.ru' },
  { role: 'Оператор', email: 'user@crm.ru' },
]

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (e) {
    // Error handled by authStore
  }
}

const quickLogin = async (targetEmail: string) => {
  email.value = targetEmail
  password.value = '12345'
  await handleLogin()
}

onMounted(() => {
  const tl = gsap.timeline()
  
  tl.fromTo('.login-container', 
    { opacity: 0, y: 30 }, 
    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
  )
  
  tl.fromTo('.auth-layout__visual-title',
    { opacity: 0, x: -30 },
    { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' },
    '-=0.6'
  )
  
  tl.fromTo('.auth-layout__visual-subtitle',
    { opacity: 0, x: -30 },
    { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' },
    '-=0.6'
  )
  
  tl.fromTo('.auth-card',
    { opacity: 0, y: 20, scale: 0.95 },
    { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.15, ease: 'back.out(1.2)' },
    '-=0.4'
  )
})
</script>

<style lang="scss">
@use '~/assets/scss/variables' as *;

.auth-layout {
  display: flex;
  min-height: 100vh;
  background-color: #0f172a;
  color: #f8fafc;
  
  &__visual {
    flex: 1;
    position: relative;
    display: none;
    overflow: hidden;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    
    @media (min-width: 1024px) {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 80px;
    }
  }
  
  &__visual-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.15) 0%, transparent 50%);
    z-index: 1;
  }
  
  &__visual-content {
    position: relative;
    z-index: 2;
    max-width: 600px;
  }
  
  &__visual-title {
    font-size: 48px;
    font-weight: 800;
    letter-spacing: -1px;
    margin-bottom: 16px;
    background: linear-gradient(to right, #60a5fa, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  &__visual-subtitle {
    font-size: 20px;
    color: #94a3b8;
    margin-bottom: 60px;
    line-height: 1.5;
  }
  
  &__visual-cards {
    position: relative;
    height: 300px;
  }
  
  &__form {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background-color: #0f172a;
    position: relative;
    z-index: 10;
    
    @media (min-width: 1024px) {
      max-width: 550px;
      background-color: #1e293b;
      box-shadow: -20px 0 50px rgba(0,0,0,0.3);
    }
  }
}

.auth-card {
  position: absolute;
  width: 320px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  
  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  }
  
  &__lines {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  &__line {
    height: 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    
    &:first-child { width: 70%; }
    &:last-child { width: 40%; }
  }
  
  &--1 { top: 0; left: 0; z-index: 3; }
  &--2 { top: 80px; left: 40px; z-index: 2; opacity: 0.8; }
  &--3 { top: 160px; left: 80px; z-index: 1; opacity: 0.6; }
}

.login-container {
  width: 100%;
  max-width: 420px;
}

.login-header {
  margin-bottom: 40px;
  text-align: center;
  
  &__title {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 12px;
    color: #f8fafc;
  }
  
  &__subtitle {
    color: #94a3b8;
    font-size: 16px;
  }
}

.login-error {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  margin-bottom: 24px;
  font-size: 14px;
  text-align: center;
}

.login-form {
  &__group {
    margin-bottom: 24px;
  }
  
  &__label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #cbd5e1;
  }
  
  &__input {
    width: 100%;
    padding: 14px 16px;
    background-color: #0f172a;
    border: 1px solid #334155;
    border-radius: 12px;
    color: #f8fafc;
    font-size: 16px;
    transition: all 0.2s;
    
    &::placeholder {
      color: #475569;
    }
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }
  }
  
  &__submit {
    width: 100%;
    padding: 16px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    margin-top: 8px;
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 15px 20px -3px rgba(59, 130, 246, 0.5);
    }
  }
}

.login-hints {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid rgba(255,255,255,0.1);
  
  h3 {
    font-size: 14px;
    color: #94a3b8;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
}

.login-hint-item {
  background: rgba(255,255,255,0.03);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.05);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  
  &:hover:not(:disabled) {
    background: rgba(255,255,255,0.08);
    border-color: rgba(96, 165, 250, 0.3);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &__role {
    font-size: 12px;
    color: #94a3b8;
    margin-bottom: 4px;
    font-weight: 600;
  }
  
  &__email {
    font-size: 13px;
    color: #60a5fa;
    font-family: monospace;
  }
}
</style>
