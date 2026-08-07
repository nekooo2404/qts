import { randomUUID } from 'node:crypto'

import {
  identityErrorResponse,
  parseIdentityUuid,
  readIdentityJson,
} from '@backend/server/identity/http'
import {
  createIdentityProviderSchema,
  createIdentityProvider,
  listIdentityProviders,
} from '@backend/server/identity/identity-provider'
import { requireTenantPermission } from '@backend/server/identity/tenant-auth'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    const tenantId = parseIdentityUuid((await context.params).id, 'tenant id')
    await requireTenantPermission(
      request,
      tenantId,
      'IDP_CONFIGURE',
      'idp.list',
    )
    return Response.json({ data: await listIdentityProviders(tenantId) })
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
      'IDP_CONFIGURE',
      'idp.create',
    )
    const input = await readIdentityJson(request, createIdentityProviderSchema)
    const provider = await createIdentityProvider(tenantId, input, {
      actorSubject: authorization.principal.subject,
      requestId: request.headers.get('x-request-id') ?? randomUUID(),
    })
    return Response.json({ data: provider }, { status: 201 })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
