export const IDENTITY_ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const
export type IdentityRole = (typeof IDENTITY_ROLES)[number]

export const IDENTITY_PERMISSIONS = [
  'USER_CREATE',
  'USER_READ',
  'USER_UPDATE',
  'USER_DELETE',
  'ROLE_MANAGE',
  'REPORT_VIEW',
  'IDP_CONFIGURE',
  'APPLICATION_MANAGE',
  'AUDIT_VIEW',
  'POLICY_MANAGE',
] as const
export type IdentityPermission = (typeof IDENTITY_PERMISSIONS)[number]

export type TenantStatus = 'PROVISIONING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED'

export type IsolationMode = 'SHARED' | 'DEDICATED'

export type TenantBranding = {
  logoUrl?: string
  primaryColor?: string
  accentColor?: string
  loginTitle?: string
}

export type Tenant = {
  id: string
  key: string
  name: string
  plan: string
  status: TenantStatus
  isolationMode: IsolationMode
  branding: TenantBranding
  createdAt: Date
  updatedAt: Date
}

export type PolicyEffect = 'ALLOW' | 'DENY'

export type PolicyOperator = 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'CONTAINS'

export type PolicyCondition = {
  attribute: string
  operator: PolicyOperator
  value: unknown
}

export type AbacPolicy = {
  id: string
  name: string
  effect: PolicyEffect
  resource: string
  action: string
  enabled: boolean
  conditions: PolicyCondition[]
}

export type AuthorizationSubject = {
  userId: string
  tenantId: string
  membershipId: string
  role: IdentityRole
  attributes: Record<string, unknown>
  rolePermissions?: IdentityPermission[]
  permissionOverrides?: Partial<Record<IdentityPermission, PolicyEffect>>
}

export type AuthorizationRequest = {
  subject: AuthorizationSubject
  permission: IdentityPermission
  resource: {
    type: string
    id?: string
    attributes?: Record<string, unknown>
  }
  action: string
  environment?: Record<string, unknown>
  policies?: AbacPolicy[]
}

export type AuthorizationDecision = {
  allowed: boolean
  reason:
    | 'ROLE_PERMISSION'
    | 'MEMBERSHIP_ALLOW'
    | 'MEMBERSHIP_DENY'
    | 'ABAC_ALLOW'
    | 'ABAC_DENY'
    | 'NO_MATCHING_PERMISSION'
  matchedPolicyIds: string[]
}
