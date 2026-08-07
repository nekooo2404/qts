'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Building2, LoaderCircle, Plus, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

type Tenant = {
  id: string
  key: string
  name: string
  plan: string
  status: string
  isolationMode: string
  createdAt: string
}

type TenantList = {
  data: Tenant[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export function IdentityTenantConsole() {
  const [result, setResult] = useState<TenantList | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState({ key: '', name: '', plan: 'STARTER' })

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/identity/tenants?page=1&pageSize=50', {
        cache: 'no-store',
      })
      const payload = (await response.json()) as
        | (TenantList & { error?: { message?: string } })
        | { data?: TenantList; error?: { message?: string } }
      const list = 'pagination' in payload ? payload : payload.data
      if (!response.ok || !list) {
        throw new Error(payload.error?.message ?? 'Unable to load tenants.')
      }
      setResult(list)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to load tenants.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [])

  async function createTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch('/api/identity/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload = (await response.json()) as {
        data?: Tenant
        error?: { message?: string }
      }
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? 'Unable to create tenant.')
      }
      setForm({ key: '', name: '', plan: 'STARTER' })
      setSuccess(`Tenant ${payload.data.key} was provisioned.`)
      await load()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to create tenant.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className="identity-console__grid"
      aria-label="Identity tenant management"
    >
      <form
        className="portal-panel identity-console__form"
        onSubmit={createTenant}
      >
        <header className="portal-panel__header">
          <div>
            <span className="identity-console__eyebrow">Provisioning</span>
            <h2>Create tenant</h2>
            <p>
              Start a shared-database tenant with an isolated membership
              boundary.
            </p>
          </div>
          <Building2 size={20} aria-hidden="true" />
        </header>
        <label className="field">
          <span>Tenant key</span>
          <input
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            maxLength={48}
            value={form.key}
            onChange={(event) =>
              setForm((current) => ({ ...current, key: event.target.value }))
            }
            placeholder="acme-vn"
          />
        </label>
        <label className="field">
          <span>Organization name</span>
          <input
            required
            maxLength={160}
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Acme Vietnam"
          />
        </label>
        <label className="field">
          <span>Plan</span>
          <select
            value={form.plan}
            onChange={(event) =>
              setForm((current) => ({ ...current, plan: event.target.value }))
            }
          >
            <option value="STARTER">Starter</option>
            <option value="GROWTH">Growth</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </label>
        {error && (
          <p className="form-message form-message--error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="form-message form-message--success" role="status">
            {success}
          </p>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? (
            <LoaderCircle
              className="is-spinning"
              size={17}
              aria-hidden="true"
            />
          ) : (
            <Plus size={17} aria-hidden="true" />
          )}
          {saving ? 'Provisioning...' : 'Create tenant'}
        </Button>
      </form>

      <section
        className="portal-panel identity-console__list"
        aria-label="Tenant list"
      >
        <header className="portal-panel__header">
          <div>
            <span className="identity-console__eyebrow">Control plane</span>
            <h2>Customer tenants</h2>
            <p>
              {result
                ? `${result.pagination.totalItems} tenant(s)`
                : 'Loading tenant inventory'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh tenants"
          >
            {loading ? (
              <LoaderCircle className="is-spinning" size={18} />
            ) : (
              <RefreshCw size={18} />
            )}
          </Button>
        </header>
        {loading && (
          <div className="identity-console__loading" role="status">
            <LoaderCircle className="is-spinning" size={20} /> Loading
            tenants...
          </div>
        )}
        {!loading && result?.data.length === 0 && (
          <p className="portal-panel__empty">
            No tenants have been provisioned yet.
          </p>
        )}
        {!loading && result && result.data.length > 0 && (
          <div className="identity-console__tenant-list">
            {result.data.map((tenant) => (
              <article className="identity-console__tenant" key={tenant.id}>
                <div
                  className="identity-console__tenant-mark"
                  aria-hidden="true"
                >
                  {tenant.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="identity-console__tenant-copy">
                  <Link href={`/admin/identity/tenants/${tenant.id}`}>
                    <strong>{tenant.name}</strong>
                  </Link>
                  <span>{tenant.key}</span>
                  <small>
                    {tenant.plan} · {tenant.isolationMode} isolation
                  </small>
                </div>
                <span
                  className={`status-badge ${
                    tenant.status === 'ACTIVE'
                      ? 'status-badge--success'
                      : tenant.status === 'SUSPENDED' ||
                          tenant.status === 'DELETED'
                        ? 'status-badge--danger'
                        : 'status-badge--warning'
                  }`}
                >
                  {tenant.status}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
