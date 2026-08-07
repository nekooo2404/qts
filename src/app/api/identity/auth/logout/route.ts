import {
  assertIdentityMutationOrigin,
  identityErrorResponse,
} from '@backend/server/identity/http'
import {
  destroyIdentitySession,
  readIdentitySession,
} from '@backend/server/identity/identity-session'
import { revokeKeycloakToken } from '@backend/server/identity/oauth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    assertIdentityMutationOrigin(request)
    const session = await readIdentitySession()
    if (session?.refreshToken) await revokeKeycloakToken(session.refreshToken)
    await destroyIdentitySession(session?.id)
    return Response.json({ data: { loggedOut: true } })
  } catch (error) {
    return identityErrorResponse(error)
  }
}

export async function GET(request: Request) {
  const response = await POST(request)
  if (response.status >= 400) return response
  return Response.redirect(new URL('/portal', request.url))
}
