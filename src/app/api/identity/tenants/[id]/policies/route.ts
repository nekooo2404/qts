import { randomUUID } from 'node:crypto'

import {
  identityErrorResponse,
  parseIdentityUuid,
  readIdentityJson,
} from '@backend/server/identity/http'
import {
  createPolicy,
  listPolicies,
} from '@backend/server/identity/policy-service'
import { policySchema } from '@backend/server/identity/schemas'
import { requireTenantPermission } from '@backend/server/identity/tenant-auth'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    const tenantId = parseIdentityUuid((await context.params).id, 'tenant id')
    await requireTenantPermission(
      request,
      tenantId,
      'POLICY_MANAGE',
      'policy.list',
    )
    return Response.json({ data: await listPolicies(tenantId) })
  } catch (error) {
    return identityErrorResponse(error)
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const tenantId = parseIdentityUuid((await context.params).id, 'tenant id')
    const authorization = await requireTenantPermission(
      request,
      tenantId,
      'POLICY_MANAGE',
      'policy.create',
    )
    const input = await readIdentityJson(request, policySchema)
    const policy = await createPolicy(tenantId, input, {
      actorSubject: authorization.principal.subject,
      requestId: request.headers.get('x-request-id') ?? randomUUID(),
    })
    return Response.json({ data: policy }, { status: 201 })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
