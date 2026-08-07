import { randomUUID } from 'node:crypto'

import { identityErrorResponse, readIdentityJson } from '@/server/identity/http'
import { verifyIdentityAccessToken } from '@/server/identity/keycloak'
import { acceptInvitation } from '@/server/identity/membership-service'
import { invitationAcceptSchema } from '@/server/identity/schemas'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const principal = await verifyIdentityAccessToken(request)
    if (!principal.email) {
      return Response.json(
        {
          error: {
            code: 'EMAIL_REQUIRED',
            message: 'An email claim is required.',
          },
        },
        { status: 422 },
      )
    }
    const input = await readIdentityJson(request, invitationAcceptSchema)
    const result = await acceptInvitation(
      input.tenantId,
      input.token,
      {
        subject: principal.subject,
        email: principal.email,
        displayName: principal.displayName,
      },
      {
        requestId: request.headers.get('x-request-id') ?? randomUUID(),
      },
    )
    return Response.json({ data: result })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
