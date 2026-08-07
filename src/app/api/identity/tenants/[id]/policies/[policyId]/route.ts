import { randomUUID } from 'node:crypto'

import {
  identityErrorResponse,
  parseIdentityUuid,
  readIdentityJson,
} from '@backend/server/identity/http'
import {
  disablePolicy,
  updatePolicy,
} from '@backend/server/identity/policy-service'
import { policyUpdateSchema } from '@backend/server/identity/schemas'
import { requireTenantPermission } from '@backend/server/identity/tenant-auth'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string; policyId: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const params = await context.params
    const tenantId = parseIdentityUuid(params.id, 'tenant id')
    const policyId = parseIdentityUuid(params.policyId, 'policy id')
    const authorization = await requireTenantPermission(
      request,
      tenantId,
      'POLICY_MANAGE',
      'policy.update',
    )
    const input = await readIdentityJson(request, policyUpdateSchema)
    const policy = await updatePolicy(tenantId, policyId, input, {
      actorSubject: authorization.principal.subject,
      requestId: request.headers.get('x-request-id') ?? randomUUID(),
    })
    return Response.json({ data: policy })
  } catch (error) {
    return identityErrorResponse(error)
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const params = await context.params
    const tenantId = parseIdentityUuid(params.id, 'tenant id')
    const policyId = parseIdentityUuid(params.policyId, 'policy id')
    const authorization = await requireTenantPermission(
      request,
      tenantId,
      'POLICY_MANAGE',
      'policy.disable',
    )
    const policy = await disablePolicy(tenantId, policyId, {
      actorSubject: authorization.principal.subject,
      requestId: request.headers.get('x-request-id') ?? randomUUID(),
    })
    return Response.json({ data: policy })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
