import { getSupabaseAdminClient } from '../../utils/supabase-admin'

interface DeleteUserBody {
  userId: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<DeleteUserBody>(event)

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
      statusMessage: 'Недостаточно прав: удаление учетных записей доступно только администраторам',
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

  // 3. Hierarchy & security checks
  if (callerId === body.userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Вы не можете удалить собственную учетную запись',
    })
  }

  // Superadmin cannot be deleted
  if (targetProfile.role === 'superadmin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Удаление учетной записи Супер Админа запрещено',
    })
  }

  // Only superadmin can delete an admin
  if (targetProfile.role === 'admin' && callerProfile.role !== 'superadmin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Только Супер Админ может удалять администраторов',
    })
  }

  // 4. Safely clean up dependent relationships before deletion
  try {
    // Unassign from org unit managers
    await adminClient.from('org_unit_managers').delete().eq('user_id', body.userId)
  } catch (err: unknown) {
    console.warn('Failed to clean up org_unit_managers for deleted user:', err)
  }

  try {
    // Nullify references in candidates and vacancies if needed
    await adminClient.from('candidates').update({ created_by: null }).eq('created_by', body.userId)
    await adminClient.from('vacancies').update({ created_by: null }).eq('created_by', body.userId)
  } catch (err: unknown) {
    console.warn('Failed to nullify references in candidates/vacancies:', err)
  }

  // 5. Delete profile record
  const { error: profileDeleteError } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', body.userId)

  if (profileDeleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Ошибка удаления профиля: ${profileDeleteError.message}`,
    })
  }

  // 6. Delete user from Supabase Auth
  try {
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(body.userId)
    if (authDeleteError) {
      console.warn('Warning: user deleted from profiles, but auth deletion failed:', authDeleteError.message)
    }
  } catch (err: unknown) {
    console.warn('Exception during auth.admin.deleteUser:', err)
  }

  return {
    success: true,
    userId: body.userId,
  }
})
