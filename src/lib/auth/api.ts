import 'server-only'

import { NextResponse } from 'next/server'

import { getCurrentUser, type AuthUser } from '@/lib/auth/session'
import { hasPermission, type PermissionKey } from '@/lib/domain/permissions'
import { messageResponse } from '@/lib/http/response'
import { isSameOriginRequest } from '@/lib/security/request'

export type ApiAuthResult =
  { user: AuthUser; error: null } | { user: null; error: NextResponse }

export async function authorizeRead(): Promise<ApiAuthResult> {
  const user = await getCurrentUser()
  if (!user) {
    return {
      user: null,
      error: messageResponse('Phiên đăng nhập đã hết hạn.', 401),
    }
  }
  return { user, error: null }
}

export async function authorizeMutation(
  request: Request,
): Promise<ApiAuthResult> {
  if (!isSameOriginRequest(request)) {
    return {
      user: null,
      error: messageResponse('Yêu cầu không cùng nguồn đã bị từ chối.', 403),
    }
  }

  const user = await getCurrentUser()
  if (!user) {
    return {
      user: null,
      error: messageResponse('Phiên đăng nhập đã hết hạn.', 401),
    }
  }

  return { user, error: null }
}

export async function authorizePermission(
  request: Request,
  permission: PermissionKey | string,
  options: { mutation?: boolean } = { mutation: true },
): Promise<ApiAuthResult> {
  const auth = options.mutation
    ? await authorizeMutation(request)
    : await authorizeRead()
  if (auth.error || !auth.user) return auth
  if (!hasPermission(auth.user, permission)) {
    return {
      user: null,
      error: messageResponse('Bạn không có quyền thực hiện thao tác này.', 403),
    }
  }
  return auth
}
