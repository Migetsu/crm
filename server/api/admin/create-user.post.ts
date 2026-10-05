import { getSupabaseAdminClient } from '../../utils/supabase-admin'
import type { UserRole } from '../../../app/types/user.types'

interface CreateUserBody {
  email: string
  password: string
  fullName: string
  role: UserRole
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateUserBody>(event)

  if (!body?.email || !body?.password || !body?.fullName || !body?.role) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Все поля (email, password, fullName, role) обязательны',
    })
  }

  const validRoles: UserRole[] = ['operator', 'operator_director', 'admin', 'superadmin']
  if (!validRoles.includes(body.role)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Указана некорректная роль пользователя',
    })
  }

  if (body.password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Пароль должен содержать не менее 6 символов',
    })
  }

  const adminClient = getSupabaseAdminClient()

  // 1. Authorize caller via header or session
  let callerId: string | null = null
  const authHeader = getHeader(event, 'authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim()
    const { data: authUser } = await adminClient.auth.getUser(token)
    callerId = authUser.user?.id || null
  }

  if (!callerId) {
    try {
      const user = await serverSupabaseUser(event)
      callerId = user?.id || null
    } catch {
      callerId = null
    }
  }

  if (!callerId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Требуется авторизация для выполнения операции',
    })
  }

  const { data: callerProfile, error: callerError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', callerId)
    .single()

  if (callerError || !callerProfile || !['admin', 'superadmin'].includes(callerProfile.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Недостаточно прав: создание учетных записей доступно только администраторам',
    })
  }

  if (['admin', 'superadmin'].includes(body.role) && callerProfile.role !== 'superadmin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Только Супер Админ может создавать пользователей с правами администратора',
    })
  }

  // 2. Create user via Supabase Auth Admin API
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: body.email.trim().toLowerCase(),
    password: body.password,
    email_confirm: true,
    user_metadata: {
      full_name: body.fullName.trim(),
      role: body.role,
    },
  })

  if (authError || !authData.user) {
    throw createError({
      statusCode: 400,
      statusMessage: authError?.message || 'Не удалось создать пользователя в Supabase Auth',
    })
  }

  // 3. Upsert profile in public.profiles
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: authData.user.id,
      email: body.email.trim().toLowerCase(),
      full_name: body.fullName.trim(),
      role: body.role,
      is_active: true,
    })
    .select()
    .single()

  if (profileError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Ошибка сохранения профиля: ${profileError.message}`,
    })
  }

  return {
    success: true,
    profile,
  }
})
