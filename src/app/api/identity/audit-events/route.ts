import { z } from 'zod'

import { listAuditEvents } from '@backend/server/identity/audit-service'
import {
  identityErrorResponse,
  parseIdentityQuery,
} from '@backend/server/identity/http'
import { requirePlatformAdministrator } from '@backend/server/identity/keycloak'

export const runtime = 'nodejs'

const filterSchema = z.object({
  tenantId: z.string().uuid().optional(),
  action: z.string().trim().min(1).max(120).optional(),
  resourceType: z.string().trim().min(1).max(120).optional(),
  outcome: z.string().trim().min(1).max(40).optional(),
  actorSubject: z.string().trim().min(1).max(255).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(request: Request) {
  try {
    await requirePlatformAdministrator(request)
    const parsed = parseIdentityQuery(request, filterSchema)
    return Response.json(
      await listAuditEvents({ ...parsed, platformAdmin: true }),
    )
  } catch (error) {
    return identityErrorResponse(error)
  }
}
