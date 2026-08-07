import { describe, expect, it } from 'vitest'

import { readBearerToken } from '@backend/server/identity/bearer-token'

describe('identity bearer token parsing', () => {
  it('extracts a syntactically valid bearer token', () => {
    const request = new Request('https://identity.example.test', {
      headers: { Authorization: 'Bearer abc.def-123_xyz' },
    })
    expect(readBearerToken(request)).toBe('abc.def-123_xyz')
  })

  it('rejects unsupported authorization schemes and whitespace', () => {
    const basic = new Request('https://identity.example.test', {
      headers: { Authorization: 'Basic abc' },
    })
    const malformed = new Request('https://identity.example.test', {
      headers: { Authorization: 'Bearer abc def' },
    })
    expect(readBearerToken(basic)).toBeNull()
    expect(readBearerToken(malformed)).toBeNull()
  })
})
