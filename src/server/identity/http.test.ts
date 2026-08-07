import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  assertIdentityMutationOrigin,
  IdentityHttpError,
  readIdentityJson,
} from '@/server/identity/http'

describe('identity HTTP boundaries', () => {
  it('rejects cross-origin mutation requests', () => {
    const request = new Request('https://identity.example.test/api', {
      method: 'POST',
      headers: {
        origin: 'https://attacker.example.test',
        host: 'identity.example.test',
      },
    })

    expect(() => assertIdentityMutationOrigin(request)).toThrowError(
      expect.objectContaining<Partial<IdentityHttpError>>({
        status: 403,
        code: 'ORIGIN_NOT_ALLOWED',
      }),
    )
  })

  it('rejects oversized JSON bodies before parsing', async () => {
    const request = new Request('https://identity.example.test/api', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(256 * 1024 + 1),
      },
      body: '{}',
    })

    await expect(readIdentityJson(request, z.object({}))).rejects.toMatchObject(
      {
        status: 413,
        code: 'REQUEST_BODY_TOO_LARGE',
      },
    )
  })
})
