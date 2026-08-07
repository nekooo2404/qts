'use client'

import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  Check,
  ClipboardCopy,
  FileKey2,
  Globe2,
  KeyRound,
  LoaderCircle,
  Palette,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

type Tab =
  'members' | 'applications' | 'providers' | 'policies' | 'domains' | 'audit'
type ApiError = { error?: { message?: string } }
type Member = {
  id: string
  email: string
  displayName: string
  status: string
  userStatus: string
  role: string
  rolePermissions?: string[]
  permissionOverrides?: Record<string, 'ALLOW' | 'DENY'>
}
type Application = {
  id: string
  name: string
  clientId: string
  type: string
  status: string
  redirectUris: string[]
}
type Provider = {
  id: string
  alias: string
  displayName: string
  type: string
  status: string
  hasSecretRef: boolean
}
type Policy = {
  id: string
  name: string
  effect: string
  resource: string
  action: string
  enabled: boolean
}
type AuditEvent = {
  id: string
  action: string
  resourceType: string
  outcome: string
  createdAt: string
  metadata: Record<string, unknown>
}
type Domain = {
  id: string
  hostname: string
  verificationStatus: string
  verifiedAt?: string | null
  createdAt: string
}
type TenantDetail = {
  id: string
  key: string
  name: string
  plan: string
  status: string
  isolationMode: string
  branding: {
    logoUrl?: string
    primaryColor?: string
    accentColor?: string
    loginTitle?: string
  }
}

type PermissionEffect = 'DEFAULT' | 'ALLOW' | 'DENY'

const permissionOptions = [
  ['USER_CREATE', 'Create users'],
  ['USER_READ', 'View users'],
  ['USER_UPDATE', 'Update users'],
  ['USER_DELETE', 'Delete users'],
  ['ROLE_MANAGE', 'Manage roles'],
  ['REPORT_VIEW', 'View reports'],
  ['IDP_CONFIGURE', 'Configure identity providers'],
  ['APPLICATION_MANAGE', 'Manage applications'],
  ['AUDIT_VIEW', 'View audit trail'],
  ['POLICY_MANAGE', 'Manage authorization policies'],
] as const

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'members', label: 'Members' },
  { id: 'applications', label: 'Applications' },
  { id: 'providers', label: 'Identity providers' },
  { id: 'policies', label: 'Policies' },
  { id: 'domains', label: 'Custom domains' },
  { id: 'audit', label: 'Audit trail' },
]

async function readPayload<T>(response: Response) {
  const payload = (await response.json()) as T & ApiError
  if (!response.ok) throw new Error(payload.error?.message ?? 'Request failed.')
  return payload
}

function statusClass(status: string) {
  if (['ACTIVE', 'SUCCESS'].includes(status)) return 'status-badge--success'
  if (['SUSPENDED', 'DENY', 'FAILURE'].includes(status))
    return 'status-badge--danger'
  return 'status-badge--warning'
}

export function IdentityTenantDetailConsole({
  tenantId,
}: {
  tenantId: string
}) {
  const [tab, setTab] = useState<Tab>('members')
  const [rows, setRows] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [invite, setInvite] = useState({ email: '', role: 'EMPLOYEE' })
  const [application, setApplication] = useState({
    name: '',
    type: 'PUBLIC',
    redirectUri: '',
  })
  const [provider, setProvider] = useState({
    type: 'GOOGLE',
    alias: '',
    displayName: '',
    clientId: '',
    issuerUrl: '',
    tenant: 'organizations',
    entityId: '',
    ssoUrl: '',
    connectionUrl: '',
    baseDn: '',
    bindDn: '',
    secretRef: '',
  })
  const [policy, setPolicy] = useState({
    name: '',
    effect: 'DENY',
    resource: '*',
    action: '*',
  })
  const [domain, setDomain] = useState({ hostname: '' })
  const [domainTokens, setDomainTokens] = useState<Record<string, string>>({})
  const [permissionEditor, setPermissionEditor] = useState<{
    membershipId: string
    values: Record<string, PermissionEffect>
  } | null>(null)
  const [tenant, setTenant] = useState<TenantDetail | null>(null)
  const [tenantLoading, setTenantLoading] = useState(true)
  const [tenantSaving, setTenantSaving] = useState(false)
  const [tenantForm, setTenantForm] = useState({
    name: '',
    plan: 'STARTER',
    status: 'PROVISIONING',
    logoUrl: '',
    primaryColor: '#146EF5',
    accentColor: '#0F172A',
    loginTitle: '',
  })

  const loadTenant = useCallback(async () => {
    setTenantLoading(true)
    try {
      const response = await fetch(`/api/identity/tenants/${tenantId}`, {
        cache: 'no-store',
      })
      const payload = await readPayload<{ data?: TenantDetail }>(response)
      if (!payload.data) throw new Error('Tenant details were not returned.')
      const nextTenant = payload.data
      setTenant(nextTenant)
      setTenantForm({
        name: nextTenant.name,
        plan: nextTenant.plan,
        status: nextTenant.status,
        logoUrl: nextTenant.branding.logoUrl ?? '',
        primaryColor: nextTenant.branding.primaryColor ?? '#146EF5',
        accentColor: nextTenant.branding.accentColor ?? '#0F172A',
        loginTitle: nextTenant.branding.loginTitle ?? '',
      })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to load tenant.',
      )
    } finally {
      setTenantLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadTenant(), 0)
    return () => window.clearTimeout(timer)
  }, [loadTenant])

  const load = useCallback(
    async (nextTab: Tab = tab) => {
      setLoading(true)
      setError(null)
      const paths: Record<Tab, string> = {
        members: 'members?page=1&pageSize=50',
        applications: 'applications',
        providers: 'identity-providers',
        policies: 'policies',
        domains: 'domains',
        audit: 'audit-events?page=1&pageSize=40',
      }
      try {
        const response = await fetch(
          `/api/identity/tenants/${tenantId}/${paths[nextTab]}`,
          { cache: 'no-store' },
        )
        const payload = await readPayload<
          { data?: unknown[] } | { data?: unknown[]; pagination?: unknown }
        >(response)
        setRows(payload.data ?? [])
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Unable to load data.',
        )
        setRows([])
      } finally {
        setLoading(false)
      }
    },
    [tab, tenantId],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => void load(tab), 0)
    return () => window.clearTimeout(timer)
  }, [load, tab])

  async function saveTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTenantSaving(true)
    setError(null)
    setNotice(null)
    try {
      const branding = {
        ...(tenantForm.logoUrl.trim()
          ? { logoUrl: tenantForm.logoUrl.trim() }
          : {}),
        primaryColor: tenantForm.primaryColor,
        accentColor: tenantForm.accentColor,
        ...(tenantForm.loginTitle.trim()
          ? { loginTitle: tenantForm.loginTitle.trim() }
          : {}),
      }
      const response = await fetch(`/api/identity/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tenantForm.name.trim(),
          plan: tenantForm.plan,
          status: tenantForm.status,
          branding,
        }),
      })
      const payload = await readPayload<{ data?: TenantDetail }>(response)
      if (!payload.data) throw new Error('Tenant update was not returned.')
      setTenant(payload.data)
      setNotice('Tenant settings saved.')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to save tenant.',
      )
    } finally {
      setTenantSaving(false)
    }
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
    path: string,
    body: unknown,
    success: string,
  ) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(
        `/api/identity/tenants/${tenantId}/${path}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      const payload = await readPayload<{
        data?: {
          invitationToken?: string
          clientSecret?: string
          verificationToken?: string
        }
      }>(response)
      const oneTimeSecret =
        payload.data?.invitationToken ??
        payload.data?.clientSecret ??
        payload.data?.verificationToken
      setNotice(
        oneTimeSecret ? `${success} One-time value: ${oneTimeSecret}` : success,
      )
      await load(tab)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed.')
    } finally {
      setSaving(false)
    }
  }

  async function changeMemberStatus(member: Member, status: string) {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/identity/tenants/${tenantId}/members/${member.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      )
      await readPayload(response)
      await load('members')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to update member.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function changeMemberRole(member: Member, role: string) {
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(
        `/api/identity/tenants/${tenantId}/members/${member.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        },
      )
      await readPayload(response)
      setNotice(`Role updated for ${member.email}.`)
      await load('members')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to update role.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function openPermissionEditor(member: Member) {
    setError(null)
    try {
      const response = await fetch(
        `/api/identity/tenants/${tenantId}/members/${member.id}/permissions`,
        { cache: 'no-store' },
      )
      const payload = await readPayload<{
        data?: { permissionOverrides?: Record<string, 'ALLOW' | 'DENY'> }
      }>(response)
      const values: Record<string, PermissionEffect> = Object.fromEntries(
        permissionOptions.map(([permission]) => [permission, 'DEFAULT']),
      )
      for (const [permission, effect] of Object.entries(
        payload.data?.permissionOverrides ?? {},
      )) {
        if (permission in values && (effect === 'ALLOW' || effect === 'DENY')) {
          values[permission] = effect
        }
      }
      setPermissionEditor({ membershipId: member.id, values })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to load permissions.',
      )
    }
  }

  async function savePermissionOverrides() {
    if (!permissionEditor) return
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const overrides = Object.entries(permissionEditor.values)
        .filter(([, effect]) => effect !== 'DEFAULT')
        .map(([permission, effect]) => ({ permission, effect }))
      const response = await fetch(
        `/api/identity/tenants/${tenantId}/members/${permissionEditor.membershipId}/permissions`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ overrides }),
        },
      )
      await readPayload(response)
      setNotice('Individual permission overrides saved.')
      setPermissionEditor(null)
      await load('members')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to save permissions.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function verifyDomain(domainId: string) {
    const token = domainTokens[domainId]?.trim()
    if (!token) {
      setError('Enter the verification token before confirming the domain.')
      return
    }
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(
        `/api/identity/tenants/${tenantId}/domains/${domainId}/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        },
      )
      await readPayload(response)
      setNotice('Custom domain verified.')
      setDomainTokens((current) => ({ ...current, [domainId]: '' }))
      await load('domains')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to verify domain.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function rotateSecret(applicationId: string) {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/identity/tenants/${tenantId}/applications/${applicationId}/rotate-secret`,
        { method: 'POST' },
      )
      const payload = await readPayload<{ data?: { clientSecret?: string } }>(
        response,
      )
      setNotice(
        `Client secret rotated. Save it now: ${payload.data?.clientSecret ?? ''}`,
      )
      await load('applications')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to rotate secret.',
      )
    } finally {
      setSaving(false)
    }
  }

  const renderMembers = () => (
    <div className="identity-detail__stack">
      <form
        className="identity-detail__inline-form"
        onSubmit={(event) =>
          void submit(
            event,
            'members',
            { email: invite.email, role: invite.role, expiresInHours: 48 },
            'Invitation created.',
          )
        }
      >
        <UserPlus size={18} aria-hidden="true" />
        <label>
          <span className="sr-only">Email</span>
          <input
            required
            type="email"
            placeholder="person@customer.com"
            value={invite.email}
            onChange={(event) =>
              setInvite({ ...invite, email: event.target.value })
            }
          />
        </label>
        <label>
          <span className="sr-only">Role</span>
          <select
            value={invite.role}
            onChange={(event) =>
              setInvite({ ...invite, role: event.target.value })
            }
          >
            <option>ADMIN</option>
            <option>MANAGER</option>
            <option>EMPLOYEE</option>
          </select>
        </label>
        <Button type="submit" size="small" disabled={saving}>
          <Plus size={16} aria-hidden="true" /> Invite
        </Button>
      </form>
      <div className="identity-detail__table-wrap">
        <table className="identity-detail__table">
          <thead>
            <tr>
              <th scope="col">Member</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {(rows as Member[]).map((member) => (
              <Fragment key={member.id}>
                <tr>
                  <td>
                    <strong>{member.displayName || member.email}</strong>
                    <small>{member.email}</small>
                  </td>
                  <td>
                    <select
                      aria-label={`Role for ${member.email}`}
                      value={member.role}
                      disabled={saving}
                      onChange={(event) =>
                        void changeMemberRole(member, event.target.value)
                      }
                    >
                      <option>ADMIN</option>
                      <option>MANAGER</option>
                      <option>EMPLOYEE</option>
                    </select>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${statusClass(member.status)}`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="identity-detail__actions-cell">
                    <select
                      aria-label={`Update ${member.email}`}
                      value={member.status}
                      disabled={saving}
                      onChange={(event) =>
                        void changeMemberStatus(member, event.target.value)
                      }
                    >
                      <option>ACTIVE</option>
                      <option>SUSPENDED</option>
                      <option>REMOVED</option>
                    </select>
                    <Button
                      type="button"
                      size="small"
                      variant="ghost"
                      disabled={saving}
                      onClick={() => void openPermissionEditor(member)}
                    >
                      <KeyRound size={15} aria-hidden="true" /> Permissions
                    </Button>
                  </td>
                </tr>
                {permissionEditor?.membershipId === member.id && (
                  <tr
                    key={`${member.id}-permissions`}
                    className="identity-detail__permission-row"
                  >
                    <td colSpan={4}>
                      <div className="identity-detail__permission-editor">
                        <div className="identity-detail__permission-editor-heading">
                          <div>
                            <strong>
                              Individual access for{' '}
                              {member.displayName || member.email}
                            </strong>
                            <small>
                              Overrides are evaluated before the tenant role and
                              can explicitly allow or deny a permission.
                            </small>
                          </div>
                          <Button
                            type="button"
                            size="small"
                            variant="ghost"
                            onClick={() => setPermissionEditor(null)}
                          >
                            Close
                          </Button>
                        </div>
                        <div className="identity-detail__permission-grid">
                          {permissionOptions.map(([permission, label]) => (
                            <label key={permission}>
                              <span>
                                {label}
                                <code>{permission}</code>
                              </span>
                              <select
                                value={
                                  permissionEditor.values[permission] ??
                                  'DEFAULT'
                                }
                                disabled={saving}
                                onChange={(event) =>
                                  setPermissionEditor((current) =>
                                    current
                                      ? {
                                          ...current,
                                          values: {
                                            ...current.values,
                                            [permission]: event.target
                                              .value as PermissionEffect,
                                          },
                                        }
                                      : current,
                                  )
                                }
                              >
                                <option value="DEFAULT">
                                  Use role default
                                </option>
                                <option value="ALLOW">Allow</option>
                                <option value="DENY">Deny</option>
                              </select>
                            </label>
                          ))}
                        </div>
                        <Button
                          type="button"
                          size="small"
                          disabled={saving}
                          onClick={() => void savePermissionOverrides()}
                        >
                          {saving ? (
                            <LoaderCircle
                              className="is-spinning"
                              size={15}
                              aria-hidden="true"
                            />
                          ) : (
                            <Save size={15} aria-hidden="true" />
                          )}
                          Save individual permissions
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {!rows.length && !loading && (
          <p className="identity-detail__empty">
            <Users size={20} /> No members yet.
          </p>
        )}
      </div>
    </div>
  )

  const renderApplications = () => (
    <div className="identity-detail__stack">
      <form
        className="identity-detail__form-grid"
        onSubmit={(event) =>
          void submit(
            event,
            'applications',
            {
              name: application.name,
              type: application.type,
              redirectUris: [application.redirectUri],
              allowedOrigins: [],
              scopes: ['openid', 'profile', 'email'],
            },
            'Application registered.',
          )
        }
      >
        <label>
          <span>Name</span>
          <input
            required
            value={application.name}
            onChange={(event) =>
              setApplication({ ...application, name: event.target.value })
            }
            placeholder="Customer CRM"
          />
        </label>
        <label>
          <span>Type</span>
          <select
            value={application.type}
            onChange={(event) =>
              setApplication({ ...application, type: event.target.value })
            }
          >
            <option>PUBLIC</option>
            <option>CONFIDENTIAL</option>
          </select>
        </label>
        <label className="identity-detail__wide">
          <span>Exact redirect URI</span>
          <input
            required
            type="url"
            value={application.redirectUri}
            onChange={(event) =>
              setApplication({
                ...application,
                redirectUri: event.target.value,
              })
            }
            placeholder="https://crm.customer.com/callback"
          />
        </label>
        <Button type="submit" size="small" disabled={saving}>
          <Plus size={16} aria-hidden="true" /> Register app
        </Button>
      </form>
      <div className="identity-detail__table-wrap">
        <table className="identity-detail__table">
          <thead>
            <tr>
              <th scope="col">Application</th>
              <th scope="col">Client ID</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {(rows as Application[]).map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  <small>{item.type}</small>
                </td>
                <td>
                  <code>{item.clientId}</code>
                </td>
                <td>
                  <span className={`status-badge ${statusClass(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  {item.type === 'CONFIDENTIAL' && item.status === 'ACTIVE' && (
                    <Button
                      size="small"
                      variant="ghost"
                      disabled={saving}
                      onClick={() => void rotateSecret(item.id)}
                    >
                      <RefreshCw size={15} aria-hidden="true" /> Rotate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !loading && (
          <p className="identity-detail__empty">
            <FileKey2 size={20} /> No applications registered.
          </p>
        )}
      </div>
    </div>
  )

  const renderProviders = () => (
    <div className="identity-detail__stack">
      <form
        className="identity-detail__form-grid"
        onSubmit={(event) =>
          void submit(
            event,
            'identity-providers',
            {
              type: provider.type,
              alias: provider.alias,
              displayName: provider.displayName,
              secretRef: provider.secretRef || undefined,
              configuration:
                provider.type === 'OIDC'
                  ? {
                      issuerUrl: provider.issuerUrl,
                      clientId: provider.clientId,
                    }
                  : provider.type === 'MICROSOFT'
                    ? { clientId: provider.clientId, tenant: provider.tenant }
                    : provider.type === 'SAML'
                      ? { entityId: provider.entityId, ssoUrl: provider.ssoUrl }
                      : provider.type === 'LDAP'
                        ? {
                            connectionUrl: provider.connectionUrl,
                            baseDn: provider.baseDn,
                            bindDn: provider.bindDn || undefined,
                          }
                        : { clientId: provider.clientId },
            },
            'Identity provider saved.',
          )
        }
      >
        <label>
          <span>Provider</span>
          <select
            value={provider.type}
            onChange={(event) =>
              setProvider({ ...provider, type: event.target.value })
            }
          >
            <option>GOOGLE</option>
            <option>MICROSOFT</option>
            <option>OIDC</option>
            <option>SAML</option>
            <option>LDAP</option>
          </select>
        </label>
        <label>
          <span>Alias</span>
          <input
            required
            value={provider.alias}
            onChange={(event) =>
              setProvider({ ...provider, alias: event.target.value })
            }
            placeholder="google-workforce"
          />
        </label>
        <label>
          <span>Display name</span>
          <input
            required
            value={provider.displayName}
            onChange={(event) =>
              setProvider({ ...provider, displayName: event.target.value })
            }
            placeholder="Google Workspace"
          />
        </label>
        {['GOOGLE', 'MICROSOFT', 'OIDC'].includes(provider.type) && (
          <label>
            <span>Client ID</span>
            <input
              required
              value={provider.clientId}
              onChange={(event) =>
                setProvider({ ...provider, clientId: event.target.value })
              }
            />
          </label>
        )}
        {provider.type === 'MICROSOFT' && (
          <label>
            <span>Microsoft tenant</span>
            <input
              required
              value={provider.tenant}
              onChange={(event) =>
                setProvider({ ...provider, tenant: event.target.value })
              }
              placeholder="organizations"
            />
          </label>
        )}
        {provider.type === 'OIDC' && (
          <label>
            <span>Issuer URL</span>
            <input
              required
              type="url"
              value={provider.issuerUrl}
              onChange={(event) =>
                setProvider({ ...provider, issuerUrl: event.target.value })
              }
              placeholder="https://idp.customer.com"
            />
          </label>
        )}
        {provider.type === 'SAML' && (
          <>
            <label>
              <span>Entity ID</span>
              <input
                required
                value={provider.entityId}
                onChange={(event) =>
                  setProvider({ ...provider, entityId: event.target.value })
                }
                placeholder="https://idp.customer.com/metadata"
              />
            </label>
            <label>
              <span>SSO URL</span>
              <input
                required
                type="url"
                value={provider.ssoUrl}
                onChange={(event) =>
                  setProvider({ ...provider, ssoUrl: event.target.value })
                }
                placeholder="https://idp.customer.com/sso"
              />
            </label>
          </>
        )}
        {provider.type === 'LDAP' && (
          <>
            <label>
              <span>LDAPS connection URL</span>
              <input
                required
                type="url"
                value={provider.connectionUrl}
                onChange={(event) =>
                  setProvider({
                    ...provider,
                    connectionUrl: event.target.value,
                  })
                }
                placeholder="ldaps://directory.customer.com:636"
              />
            </label>
            <label>
              <span>Base DN</span>
              <input
                required
                value={provider.baseDn}
                onChange={(event) =>
                  setProvider({ ...provider, baseDn: event.target.value })
                }
                placeholder="ou=people,dc=customer,dc=com"
              />
            </label>
            <label>
              <span>Bind DN (optional)</span>
              <input
                value={provider.bindDn}
                onChange={(event) =>
                  setProvider({ ...provider, bindDn: event.target.value })
                }
              />
            </label>
          </>
        )}
        <label>
          <span>Secret reference</span>
          <input
            value={provider.secretRef}
            onChange={(event) =>
              setProvider({ ...provider, secretRef: event.target.value })
            }
            placeholder="vault://qts/customer/provider"
          />
        </label>
        <Button type="submit" size="small" disabled={saving}>
          <ShieldCheck size={16} aria-hidden="true" /> Save provider
        </Button>
      </form>
      <div className="identity-detail__table-wrap">
        <table className="identity-detail__table">
          <thead>
            <tr>
              <th scope="col">Provider</th>
              <th scope="col">Type</th>
              <th scope="col">Secret</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {(rows as Provider[]).map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.displayName}</strong>
                  <small>{item.alias}</small>
                </td>
                <td>
                  <code>{item.type}</code>
                </td>
                <td>
                  {item.hasSecretRef ? (
                    <span className="identity-detail__secure">
                      <Check size={14} /> secret_ref
                    </span>
                  ) : (
                    'Not set'
                  )}
                </td>
                <td>
                  <span className={`status-badge ${statusClass(item.status)}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !loading && (
          <p className="identity-detail__empty">
            <ShieldCheck size={20} /> No providers configured.
          </p>
        )}
      </div>
    </div>
  )

  const renderPolicies = () => (
    <div className="identity-detail__stack">
      <form
        className="identity-detail__form-grid"
        onSubmit={(event) =>
          void submit(
            event,
            'policies',
            {
              name: policy.name,
              effect: policy.effect,
              resource: policy.resource,
              action: policy.action,
              conditions: [],
              enabled: true,
            },
            'Policy created.',
          )
        }
      >
        <label>
          <span>Name</span>
          <input
            required
            value={policy.name}
            onChange={(event) =>
              setPolicy({ ...policy, name: event.target.value })
            }
            placeholder="Block external report access"
          />
        </label>
        <label>
          <span>Effect</span>
          <select
            value={policy.effect}
            onChange={(event) =>
              setPolicy({ ...policy, effect: event.target.value })
            }
          >
            <option>DENY</option>
            <option>ALLOW</option>
          </select>
        </label>
        <label>
          <span>Resource</span>
          <input
            value={policy.resource}
            onChange={(event) =>
              setPolicy({ ...policy, resource: event.target.value })
            }
          />
        </label>
        <label>
          <span>Action</span>
          <input
            value={policy.action}
            onChange={(event) =>
              setPolicy({ ...policy, action: event.target.value })
            }
          />
        </label>
        <Button type="submit" size="small" disabled={saving}>
          <Plus size={16} aria-hidden="true" /> Add policy
        </Button>
      </form>
      <div className="identity-detail__table-wrap">
        <table className="identity-detail__table">
          <thead>
            <tr>
              <th scope="col">Policy</th>
              <th scope="col">Match</th>
              <th scope="col">Effect</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {(rows as Policy[]).map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                </td>
                <td>
                  <code>
                    {item.resource}:{item.action}
                  </code>
                </td>
                <td>
                  <span
                    className={`status-badge ${item.effect === 'DENY' ? 'status-badge--danger' : 'status-badge--success'}`}
                  >
                    {item.effect}
                  </span>
                </td>
                <td>{item.enabled ? 'Enabled' : 'Disabled'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !loading && (
          <p className="identity-detail__empty">
            <ShieldCheck size={20} /> No ABAC policies configured.
          </p>
        )}
      </div>
    </div>
  )

  const renderDomains = () => (
    <div className="identity-detail__stack">
      <form
        className="identity-detail__inline-form"
        onSubmit={(event) =>
          void submit(
            event,
            'domains',
            { hostname: domain.hostname },
            'Custom domain created. Publish the returned token as a DNS TXT record before verifying.',
          )
        }
      >
        <Globe2 size={18} aria-hidden="true" />
        <label>
          <span className="sr-only">Hostname</span>
          <input
            required
            value={domain.hostname}
            onChange={(event) => setDomain({ hostname: event.target.value })}
            placeholder="login.customer.com"
          />
        </label>
        <Button type="submit" size="small" disabled={saving}>
          <Plus size={16} aria-hidden="true" /> Add domain
        </Button>
      </form>
      <div className="identity-detail__table-wrap">
        <table className="identity-detail__table">
          <thead>
            <tr>
              <th scope="col">Hostname</th>
              <th scope="col">Status</th>
              <th scope="col">Verification</th>
            </tr>
          </thead>
          <tbody>
            {(rows as Domain[]).map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.hostname}</strong>
                  <small>
                    {item.verifiedAt
                      ? `Verified ${new Date(item.verifiedAt).toLocaleString()}`
                      : 'DNS ownership required'}
                  </small>
                </td>
                <td>
                  <span
                    className={`status-badge ${statusClass(item.verificationStatus)}`}
                  >
                    {item.verificationStatus}
                  </span>
                </td>
                <td className="identity-detail__actions-cell">
                  {item.verificationStatus !== 'VERIFIED' && (
                    <>
                      <input
                        aria-label={`Verification token for ${item.hostname}`}
                        value={domainTokens[item.id] ?? ''}
                        onChange={(event) =>
                          setDomainTokens((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        placeholder="Paste token"
                      />
                      <Button
                        type="button"
                        size="small"
                        variant="ghost"
                        disabled={saving}
                        onClick={() => void verifyDomain(item.id)}
                      >
                        <ShieldCheck size={15} aria-hidden="true" /> Verify
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !loading && (
          <p className="identity-detail__empty">
            <Globe2 size={20} /> No custom domains configured.
          </p>
        )}
      </div>
    </div>
  )

  const renderAudit = () => (
    <div className="identity-detail__table-wrap">
      <table className="identity-detail__table">
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Action</th>
            <th scope="col">Resource</th>
            <th scope="col">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {(rows as AuditEvent[]).map((item) => (
            <tr key={item.id}>
              <td>
                <time dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString()}
                </time>
              </td>
              <td>
                <code>{item.action}</code>
              </td>
              <td>{item.resourceType}</td>
              <td>
                <span className={`status-badge ${statusClass(item.outcome)}`}>
                  {item.outcome}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && !loading && (
        <p className="identity-detail__empty">
          <ClipboardCopy size={20} /> No audit events yet.
        </p>
      )}
    </div>
  )

  return (
    <section
      className="identity-detail"
      aria-label="Tenant identity operations"
    >
      <section
        className="portal-panel identity-detail__tenant-settings"
        aria-label="Tenant settings"
      >
        <header className="portal-panel__header">
          <div>
            <span className="identity-console__eyebrow">Tenant boundary</span>
            <h2>{tenant?.name ?? 'Tenant settings'}</h2>
            <p>
              {tenant
                ? `${tenant.key} · ${tenant.isolationMode} isolation`
                : 'Loading tenant configuration'}
            </p>
          </div>
          <Palette size={20} aria-hidden="true" />
        </header>
        {tenantLoading ? (
          <div className="identity-detail__loading" role="status">
            <LoaderCircle className="is-spinning" size={20} /> Loading tenant
            settings...
          </div>
        ) : (
          <form className="identity-detail__form-grid" onSubmit={saveTenant}>
            <label>
              <span>Organization name</span>
              <input
                required
                maxLength={160}
                value={tenantForm.name}
                onChange={(event) =>
                  setTenantForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Plan</span>
              <select
                value={tenantForm.plan}
                onChange={(event) =>
                  setTenantForm((current) => ({
                    ...current,
                    plan: event.target.value,
                  }))
                }
              >
                <option value="STARTER">Starter</option>
                <option value="GROWTH">Growth</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </label>
            <label>
              <span>Tenant status</span>
              <select
                value={tenantForm.status}
                onChange={(event) =>
                  setTenantForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="PROVISIONING">Provisioning</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </label>
            <label>
              <span>Login title</span>
              <input
                maxLength={80}
                value={tenantForm.loginTitle}
                onChange={(event) =>
                  setTenantForm((current) => ({
                    ...current,
                    loginTitle: event.target.value,
                  }))
                }
                placeholder="Sign in to your workspace"
              />
            </label>
            <label className="identity-detail__wide">
              <span>Logo URL (HTTPS)</span>
              <input
                type="url"
                maxLength={2048}
                value={tenantForm.logoUrl}
                onChange={(event) =>
                  setTenantForm((current) => ({
                    ...current,
                    logoUrl: event.target.value,
                  }))
                }
                placeholder="https://assets.customer.com/logo.svg"
              />
            </label>
            <label>
              <span>Primary color</span>
              <input
                type="color"
                value={tenantForm.primaryColor}
                onChange={(event) =>
                  setTenantForm((current) => ({
                    ...current,
                    primaryColor: event.target.value,
                  }))
                }
                aria-label="Primary color"
              />
            </label>
            <label>
              <span>Accent color</span>
              <input
                type="color"
                value={tenantForm.accentColor}
                onChange={(event) =>
                  setTenantForm((current) => ({
                    ...current,
                    accentColor: event.target.value,
                  }))
                }
                aria-label="Accent color"
              />
            </label>
            <div className="identity-detail__wide identity-detail__form-actions">
              <Button type="submit" disabled={tenantSaving}>
                {tenantSaving ? (
                  <LoaderCircle className="is-spinning" size={17} />
                ) : (
                  <Save size={17} />
                )}
                {tenantSaving ? 'Saving...' : 'Save tenant settings'}
              </Button>
            </div>
          </form>
        )}
      </section>
      <nav
        className="identity-detail__tabs"
        aria-label="Tenant resources"
        role="tablist"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'is-active' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Refresh current view"
          onClick={() => void load(tab)}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? 'is-spinning' : undefined}
          />
        </Button>
      </nav>
      {(error || notice) && (
        <div
          className={`identity-detail__message ${error ? 'is-error' : 'is-success'}`}
          role={error ? 'alert' : 'status'}
        >
          {error ?? notice}
        </div>
      )}
      {loading ? (
        <div className="identity-detail__loading" role="status">
          <LoaderCircle className="is-spinning" size={22} /> Loading {tab}...
        </div>
      ) : tab === 'members' ? (
        renderMembers()
      ) : tab === 'applications' ? (
        renderApplications()
      ) : tab === 'providers' ? (
        renderProviders()
      ) : tab === 'policies' ? (
        renderPolicies()
      ) : tab === 'domains' ? (
        renderDomains()
      ) : (
        renderAudit()
      )}
    </section>
  )
}
