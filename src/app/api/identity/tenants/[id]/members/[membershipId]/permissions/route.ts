import { randomUUID } from 'node:crypto'

import {
  identityErrorResponse,
  parseIdentityUuid,
  readIdentityJson,
} from '@/server/identity/http'
import {
  getMembershipPermissionOverrides,
  setMembershipPermissionOverrides,
} from '@/server/identity/membership-service'
import { membershipPermissionOverridesSchema } from '@/server/identity/schemas'
import { requireTenantPermission } from '@/server/identity/tenant-auth'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string; membershipId: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    const params = await context.params
    const tenantId = parseIdentityUuid(params.id, 'tenant id')
    const membershipId = parseIdentityUuid(params.membershipId, 'membership id')
    await requireTenantPermission(
      request,
      tenantId,
      'POLICY_MANAGE',
      'membership.permissions.read',
    )
    return Response.json({
      data: await getMembershipPermissionOverrides(tenantId, membershipId),
    })
  } catch (error) {
    return identityErrorResponse(error)
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const params = await context.params
    const tenantId = parseIdentityUuid(params.id, 'tenant id')
    const membershipId = parseIdentityUuid(params.membershipId, 'membership id')
    const authorization = await requireTenantPermission(
      request,
      tenantId,
      'POLICY_MANAGE',
      'membership.permissions.update',
    )
    const input = await readIdentityJson(
      request,
      membershipPermissionOverridesSchema,
    )
    const result = await setMembershipPermissionOverrides(
      tenantId,
      membershipId,
      input.overrides,
      {
        actorSubject: authorization.principal.subject,
        requestId: request.headers.get('x-request-id') ?? randomUUID(),
      },
    )
    return Response.json({ data: result })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
