import 'server-only'

import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/auth/session'
import type { AuthUser } from '@/lib/auth/types'

export async function requirePortalUser(): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/portal/login')
  }

  return user
}
