import { randomUUID } from 'node:crypto'

import {
  identityErrorResponse,
  parseIdentityUuid,
} from '@backend/server/identity/http'
import { rotateApplicationSecret } from '@backend/server/identity/application-service'
import { requireTenantPermission } from '@backend/server/identity/tenant-auth'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string; applicationId: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const params = await context.params
    const tenantId = parseIdentityUuid(params.id, 'tenant id')
    const applicationId = parseIdentityUuid(
      params.applicationId,
      'application id',
    )
    const authorization = await requireTenantPermission(
      request,
      tenantId,
      'APPLICATION_MANAGE',
      'application.rotate_secret',
    )
    const result = await rotateApplicationSecret(tenantId, applicationId, {
      actorSubject: authorization.principal.subject,
      requestId: request.headers.get('x-request-id') ?? randomUUID(),
    })
    return Response.json({ data: result })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
