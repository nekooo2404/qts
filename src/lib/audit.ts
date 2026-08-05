import 'server-only'

import { db } from '@/lib/db'
import { sha256 } from '@/lib/security/hash'
import { requestIp } from '@/lib/security/request'

type AuditInput = {
  request: Request
  userId?: string | null
  action: string
  entity: string
  entityId?: string | null
  metadata?: Record<string, string | number | boolean | null>
}

export async function recordAudit(input: AuditInput) {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        metadata: input.metadata,
        ipHash: sha256(requestIp(input.request)),
      },
    })
  } catch (error) {
    console.error('Không thể ghi audit log.', error)
  }
}
