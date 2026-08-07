import { randomUUID } from 'node:crypto'

import {
  identityErrorResponse,
  parseIdentityUuid,
  readIdentityJson,
} from '@backend/server/identity/http'
import { updateApplication } from '@backend/server/identity/application-service'
import { applicationUpdateSchema } from '@backend/server/identity/schemas'
import { requireTenantPermission } from '@backend/server/identity/tenant-auth'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string; applicationId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
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
      'application.update',
    )
    const input = await readIdentityJson(request, applicationUpdateSchema)
    const application = await updateApplication(
      tenantId,
      applicationId,
      input,
      {
        actorSubject: authorization.principal.subject,
        requestId: request.headers.get('x-request-id') ?? randomUUID(),
      },
    )
    return Response.json({ data: application })
  } catch (error) {
    return identityErrorResponse(error)
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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
      'application.revoke',
    )
    const application = await updateApplication(
      tenantId,
      applicationId,
      { status: 'REVOKED' },
      {
        actorSubject: authorization.principal.subject,
        requestId: request.headers.get('x-request-id') ?? randomUUID(),
      },
    )
    return Response.json({ data: application })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
