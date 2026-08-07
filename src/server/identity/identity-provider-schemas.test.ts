import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  createIdentityProviderSchema,
  updateIdentityProviderSchema,
} from '@/server/identity/identity-provider'

describe('identity provider configuration contract', () => {
  it('accepts a Google provider with a reference, never a secret value', () => {
    const result = createIdentityProviderSchema.parse({
      type: 'GOOGLE',
      alias: 'google-workforce',
      displayName: 'Google Workspace',
      secretRef: 'vault://qts/acme/google',
      configuration: {
        clientId: 'client-id.apps.googleusercontent.com',
        hostedDomain: 'acme.example',
      },
    })

    expect(result.configuration).toMatchObject({
      clientId: 'client-id.apps.googleusercontent.com',
    })
    expect(result.secretRef).toBe('vault://qts/acme/google')
  })

  it('rejects secret-shaped configuration keys and raw secret refs', () => {
    expect(
      createIdentityProviderSchema.safeParse({
        type: 'GOOGLE',
        alias: 'google',
        displayName: 'Google',
        secretRef: 'plain-client-secret',
        configuration: {
          clientId: 'client-id',
          clientSecret: 'must-not-be-stored',
        },
      }).success,
    ).toBe(false)
  })

  it('requires secure endpoints for OIDC, SAML and LDAP configuration', () => {
    expect(
      createIdentityProviderSchema.safeParse({
        type: 'OIDC',
        alias: 'oidc',
        displayName: 'OIDC',
        configuration: {
          issuerUrl: 'http://issuer.example',
          clientId: 'client-id',
        },
      }).success,
    ).toBe(false)

    expect(
      createIdentityProviderSchema.safeParse({
        type: 'SAML',
        alias: 'saml',
        displayName: 'SAML',
        configuration: {
          entityId: 'https://idp.example/entity',
          ssoUrl: 'http://idp.example/sso',
        },
      }).success,
    ).toBe(false)

    expect(
      createIdentityProviderSchema.safeParse({
        type: 'LDAP',
        alias: 'ldap',
        displayName: 'LDAP',
        configuration: {
          connectionUrl: 'ldap://directory.example',
          baseDn: 'dc=example,dc=com',
        },
      }).success,
    ).toBe(false)
  })

  it('requires at least one update field and permits clearing a reference', () => {
    expect(updateIdentityProviderSchema.safeParse({}).success).toBe(false)
    expect(
      updateIdentityProviderSchema.parse({ secretRef: null }),
    ).toMatchObject({ secretRef: null })
  })
})
