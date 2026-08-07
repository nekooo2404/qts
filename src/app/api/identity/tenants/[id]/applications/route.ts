import { randomUUID } from 'node:crypto'

import {
  identityErrorResponse,
  parseIdentityUuid,
  readIdentityJson,
} from '@backend/server/identity/http'
import {
  createApplication,
  listApplications,
} from '@backend/server/identity/application-service'
import { applicationSchema } from '@backend/server/identity/schemas'
import { requireTenantPermission } from '@backend/server/identity/tenant-auth'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    const tenantId = parseIdentityUuid((await context.params).id, 'tenant id')
    await requireTenantPermission(
      request,
      tenantId,
      'APPLICATION_MANAGE',
      'application.list',
    )
    return Response.json(await listApplications(tenantId))
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
      'APPLICATION_MANAGE',
      'application.create',
    )
    const input = await readIdentityJson(request, applicationSchema)
    const application = await createApplication(tenantId, input, {
      actorSubject: authorization.principal.subject,
      requestId: request.headers.get('x-request-id') ?? randomUUID(),
    })
    return Response.json({ data: application }, { status: 201 })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
