import { z } from 'zod'

import { listAuditEvents } from '@backend/server/identity/audit-service'
import {
  identityErrorResponse,
  parseIdentityQuery,
  parseIdentityUuid,
} from '@backend/server/identity/http'
import { requireTenantPermission } from '@backend/server/identity/tenant-auth'

export const runtime = 'nodejs'

const filterSchema = z.object({
  action: z.string().trim().min(1).max(120).optional(),
  resourceType: z.string().trim().min(1).max(120).optional(),
  outcome: z.string().trim().min(1).max(40).optional(),
  actorSubject: z.string().trim().min(1).max(255).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    const tenantId = parseIdentityUuid((await context.params).id, 'tenant id')
    await requireTenantPermission(request, tenantId, 'AUDIT_VIEW', 'audit.list')
    const parsed = parseIdentityQuery(request, filterSchema)
    return Response.json(await listAuditEvents({ ...parsed, tenantId }))
  } catch (error) {
    return identityErrorResponse(error)
  }
}
