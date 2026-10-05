import { getSupabaseAdminClient } from '../../utils/supabase-admin'
import type { UserRole } from '../../../app/types/user.types'

interface UpdateUserBody {
  userId: string
  role?: UserRole
  isActive?: boolean
  is_active?: boolean
  fullName?: string
  full_name?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<UpdateUserBody>(event)

  if (!body?.userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Параметр userId обязателен',
    })
  }

  const adminClient = getSupabaseAdminClient()

  // 1. Authorize caller via header or session
  let callerId: string | null = null
  const authHeader = getHeader(event, 'authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim()
    try {
      const { data: authUser } = await adminClient.auth.getUser(token)
      callerId = authUser.user?.id || null
    } catch {
      callerId = null
    }
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
      statusMessage: 'Требуется авторизация',
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
      statusMessage: 'Недостаточно прав: управление ролями и статусом доступно только администраторам',
    })
  }

  // 2. Fetch target user profile
  const { data: targetProfile, error: targetError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', body.userId)
    .single()

  if (targetError || !targetProfile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Пользователь не найден',
    })
  }

  // Normalize isActive boolean
  const targetIsActive = typeof body.isActive === 'boolean'
    ? body.isActive
    : (typeof body.is_active === 'boolean' ? body.is_active : undefined)

  // 3. Hierarchy & security checks
  if (callerId === body.userId && targetIsActive === false) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Вы не можете деактивировать собственную учетную запись',
    })
  }

  // Only superadmin can modify other admins/superadmins
  if (['admin', 'superadmin'].includes(targetProfile.role) && callerProfile.role !== 'superadmin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Только Супер Админ может изменять учетные записи администраторов',
    })
  }

  // Only superadmin can promote anyone to admin or superadmin
  if (body.role && ['admin', 'superadmin'].includes(body.role) && callerProfile.role !== 'superadmin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Только Супер Админ может назначать права администратора',
    })
  }

  // 4. Update public.profiles
  const profileUpdates: Record<string, unknown> = {}
  if (body.role) profileUpdates.role = body.role
  if (typeof targetIsActive === 'boolean') profileUpdates.is_active = targetIsActive
  const targetFullName = body.fullName || body.full_name
  if (targetFullName) profileUpdates.full_name = targetFullName.trim()

  let updatedProfile = targetProfile
  if (Object.keys(profileUpdates).length > 0) {
    const { data: updated, error: updateError } = await adminClient
      .from('profiles')
      .update(profileUpdates)
      .eq('id', body.userId)
      .select('*')
      .maybeSingle()

    if (updateError) {
      throw createError({
        statusCode: 400,
        statusMessage: `Ошибка обновления профиля: ${updateError.message}`,
      })
    }
    if (updated) {
      updatedProfile = updated
    }
  }

  // 5. Synchronize with Supabase Auth (metadata and ban state)
  const authUpdates: Record<string, unknown> = {}
  if (body.role) {
    authUpdates.user_metadata = { role: body.role }
  }
  if (typeof targetIsActive === 'boolean') {
    authUpdates.ban_duration = targetIsActive ? 'none' : '876000h'
  }

  if (Object.keys(authUpdates).length > 0) {
    try {
      await adminClient.auth.admin.updateUserById(body.userId, authUpdates)
    } catch (err: unknown) {
      console.warn('Supabase Auth sync warning:', err)
    }
  }

  return {
    success: true,
    profile: updatedProfile,
  }
})
