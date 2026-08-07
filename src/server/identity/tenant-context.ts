import 'server-only'

import { z } from 'zod'

import { IdentityHttpError } from '@/server/identity/http'

const tenantIdSchema = z.string().uuid()

export function readTenantId(request: Request) {
  const result = tenantIdSchema.safeParse(request.headers.get('x-tenant-id'))
  if (!result.success) {
    throw new IdentityHttpError(
      400,
      'TENANT_CONTEXT_REQUIRED',
      'A valid X-Tenant-Id header is required.',
    )
  }
  return result.data
}
