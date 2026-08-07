import { evaluateAuthorization } from '@backend/server/identity/authorization-engine'
import {
  identityErrorResponse,
  readIdentityJson,
} from '@backend/server/identity/http'
import { verifyIdentityAccessToken } from '@backend/server/identity/keycloak'
import { loadAuthorizationContext } from '@backend/server/identity/membership-service'
import { authorizationCheckSchema } from '@backend/server/identity/schemas'
import { readTenantId } from '@backend/server/identity/tenant-context'
import { getTenant } from '@backend/server/identity/tenant-service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const principal = await verifyIdentityAccessToken(request)
    const tenantId = readTenantId(request)
    const input = await readIdentityJson(request, authorizationCheckSchema)
    let context
    if (principal.realmRoles.includes('platform-admin')) {
      await getTenant(tenantId)
      context = {
        subject: {
          userId: 'platform-admin',
          tenantId,
          membershipId: 'platform-admin',
          role: 'ADMIN' as const,
          attributes: {},
        },
        policies: [],
      }
    } else {
      context = await loadAuthorizationContext(tenantId, principal.subject)
    }
    const decision = evaluateAuthorization({
      subject: context.subject,
      permission: input.permission,
      resource: input.resource,
      action: input.action,
      environment: input.environment,
      policies: context.policies,
    })

    return Response.json({ data: decision })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
