import { renderIdentityMetrics } from '@backend/server/identity/metrics'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  return renderIdentityMetrics(request)
}
