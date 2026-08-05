import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/auth/session'

export default async function PortalIndexPage() {
  const user = await getCurrentUser()
  redirect(user ? '/portal/dashboard' : '/portal/login')
}
