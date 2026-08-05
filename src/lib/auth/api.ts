import 'server-only'

import { NextResponse } from 'next/server'

import { getCurrentUser, type AuthUser } from '@/lib/auth/session'
import { messageResponse } from '@/lib/http/response'
import { isSameOriginRequest } from '@/lib/security/request'

type ApiAuthResult =
  { user: AuthUser; error: null } | { user: null; error: NextResponse }

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
