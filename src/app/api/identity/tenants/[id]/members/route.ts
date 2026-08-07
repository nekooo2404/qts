import { randomUUID } from 'node:crypto'

import {
  identityErrorResponse,
  parseIdentityQuery,
  parseIdentityUuid,
  readIdentityJson,
} from '@backend/server/identity/http'
import {
  createInvitation,
  listMembers,
} from '@backend/server/identity/membership-service'
import { invitationSchema } from '@backend/server/identity/schemas'
import { requireTenantPermission } from '@backend/server/identity/tenant-auth'
import { z } from 'zod'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

const memberListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
})

export async function GET(request: Request, context: RouteContext) {
  try {
    const tenantId = parseIdentityUuid((await context.params).id, 'tenant id')
    await requireTenantPermission(request, tenantId, 'USER_READ', 'user.list')
    const query = parseIdentityQuery(request, memberListQuerySchema)
    const result = await listMembers(tenantId, query)
    return Response.json(result)
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
      'USER_CREATE',
      'user.invite',
    )
    const input = await readIdentityJson(request, invitationSchema)
    const invitation = await createInvitation(tenantId, input, {
      actorSubject: authorization.principal.subject,
      requestId: request.headers.get('x-request-id') ?? randomUUID(),
    })
    return Response.json({ data: invitation }, { status: 201 })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
