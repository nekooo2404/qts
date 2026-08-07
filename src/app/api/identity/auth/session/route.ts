import { identityErrorResponse } from '@/server/identity/http'
import { readIdentitySession } from '@/server/identity/identity-session'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await readIdentitySession()
    if (!session) {
      return Response.json({ data: { authenticated: false } })
    }
    return Response.json({
      data: {
        authenticated: true,
        subject: session.subject,
        email: session.email,
        displayName: session.displayName,
        tenantId: session.tenantId,
        accessTokenExpiresAt: session.accessTokenExpiresAt,
      },
    })
  } catch (error) {
    return identityErrorResponse(error)
  }
}
