import { randomUUID } from 'node:crypto'

import {
  identityErrorResponse,
  parseIdentityUuid,
  readIdentityJson,
} from '@/server/identity/http'
import { updateMembership } from '@/server/identity/membership-service'
import { membershipUpdateSchema } from '@/server/identity/schemas'
import { requireTenantPermission } from '@/server/identity/tenant-auth'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string; membershipId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const params = await context.params
    const tenantId = parseIdentityUuid(params.id, 'tenant id')
    const membershipId = parseIdentityUuid(params.membershipId, 'membership id')
    const input = await readIdentityJson(request, membershipUpdateSchema)
    const authorization = await requireTenantPermission(
      request,
      tenantId,
      input.role ? 'ROLE_MANAGE' : 'USER_UPDATE',
      input.role ? 'membership.role.update' : 'user.update',
    )
    const membership = await updateMembership(tenantId, membershipId, input, {
      actorSubject: authorization.principal.subject,
      actorRole: authorization.subject.role,
      requestId: request.headers.get('x-request-id') ?? randomUUID(),
    })
    return Response.json({ data: membership })
  } catch (error) {
    return identityErrorResponse(error)
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const params = await context.params
    const tenantId = parseIdentityUuid(params.id, 'tenant id')
    const membershipId = parseIdentityUuid(params.membershipId, 'membership id')
    const authorization = await requireTenantPermission(
      request,
      tenantId,
      'USER_DELETE',
      'user.remove',
    )
    const membership = await updateMembership(
      tenantId,
      membershipId,
      { status: 'REMOVED' },
      {
        actorSubject: authorization.principal.subject,
        actorRole: authorization.subject.role,
        requestId: request.headers.get('x-request-id') ?? randomUUID(),
      },
    )
    return Response.json({ data: membership })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
