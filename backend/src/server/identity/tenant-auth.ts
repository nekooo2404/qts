import 'server-only'

import { evaluateAuthorization } from '@backend/server/identity/authorization-engine'
import { IdentityHttpError } from '@backend/server/identity/http'
import {
  requireStrongAuthentication,
  verifyIdentityAccessToken,
} from '@backend/server/identity/keycloak'
import { loadAuthorizationContext } from '@backend/server/identity/membership-service'
import { getTenant } from '@backend/server/identity/tenant-service'
import type { IdentityPermission } from '@backend/server/identity/types'

export async function requireTenantPermission(
  request: Request,
  tenantId: string,
  permission: IdentityPermission,
  action: string,
) {
  const principal = await verifyIdentityAccessToken(request)
  if (
    [
      'USER_UPDATE',
      'USER_DELETE',
      'ROLE_MANAGE',
      'IDP_CONFIGURE',
      'POLICY_MANAGE',
      'APPLICATION_MANAGE',
    ].includes(permission)
  ) {
    requireStrongAuthentication(principal)
  }
  if (principal.realmRoles.includes('platform-admin')) {
    await getTenant(tenantId)
    return {
      principal,
      subject: {
        userId: 'platform-admin',
        tenantId,
        membershipId: 'platform-admin',
        role: 'ADMIN' as const,
        attributes: {},
      },
      policies: [],
    }
  }

  const context = await loadAuthorizationContext(tenantId, principal.subject)
  const decision = evaluateAuthorization({
    subject: context.subject,
    permission,
    resource: { type: 'tenant', id: tenantId },
    action,
    policies: context.policies,
  })
  if (!decision.allowed) {
    throw new IdentityHttpError(
      403,
      'FORBIDDEN',
      'The active tenant membership is not allowed to perform this action.',
      { reason: decision.reason },
    )
  }

  return {
    principal,
    subject: context.subject,
    policies: context.policies,
  }
}
