import type { PermissionKey, RoleName } from '@/lib/domain/permissions'

export type AuthUser = {
  id: string
  email: string
  name: string
  phone: string | null
  title: string | null
  avatarUrl: string | null
  role: RoleName
  roleLabel: string
  organizationId: string | null
  organizationName: string | null
  /** Effective role defaults after per-account ALLOW/DENY overrides. */
  permissions: PermissionKey[]
  /** Stable alias used by navigation and server guards. */
  permissionKeys: PermissionKey[]
}
