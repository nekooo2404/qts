import { randomUUID } from 'node:crypto'

import {
  identityErrorResponse,
  parseIdentityUuid,
  readIdentityJson,
} from '@backend/server/identity/http'
import {
  getIdentityProvider,
  suspendIdentityProvider,
  updateIdentityProvider,
  updateIdentityProviderSchema,
} from '@backend/server/identity/identity-provider'
import { requireTenantPermission } from '@backend/server/identity/tenant-auth'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string; providerId: string }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const params = await context.params
    const tenantId = parseIdentityUuid(params.id, 'tenant id')
    const providerId = parseIdentityUuid(params.providerId, 'provider id')
    await requireTenantPermission(
      request,
      tenantId,
      'IDP_CONFIGURE',
      'idp.read',
    )
    return Response.json({
      data: await getIdentityProvider(tenantId, providerId),
    })
  } catch (error) {
    return identityErrorResponse(error)
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const params = await context.params
    const tenantId = parseIdentityUuid(params.id, 'tenant id')
    const providerId = parseIdentityUuid(params.providerId, 'provider id')
    const authorization = await requireTenantPermission(
      request,
      tenantId,
      'IDP_CONFIGURE',
      'idp.update',
    )
    const input = await readIdentityJson(request, updateIdentityProviderSchema)
    const provider = await updateIdentityProvider(tenantId, providerId, input, {
      actorSubject: authorization.principal.subject,
      requestId: request.headers.get('x-request-id') ?? randomUUID(),
    })
    return Response.json({ data: provider })
  } catch (error) {
    return identityErrorResponse(error)
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const params = await context.params
    const tenantId = parseIdentityUuid(params.id, 'tenant id')
    const providerId = parseIdentityUuid(params.providerId, 'provider id')
    const authorization = await requireTenantPermission(
      request,
      tenantId,
      'IDP_CONFIGURE',
      'idp.suspend',
    )
    const provider = await suspendIdentityProvider(tenantId, providerId, {
      actorSubject: authorization.principal.subject,
      requestId: request.headers.get('x-request-id') ?? randomUUID(),
    })
    return Response.json({ data: provider })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
