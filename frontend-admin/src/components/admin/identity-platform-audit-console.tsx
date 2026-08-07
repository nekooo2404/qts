'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Filter, LoaderCircle, RefreshCw, ScrollText } from 'lucide-react'

import { Button } from '@/components/ui/button'

type AuditEvent = {
  id: string
  tenantKey: string | null
  tenantName: string | null
  action: string
  resourceType: string
  resourceId: string | null
  outcome: string
  actorUserId: string | null
  createdAt: string
}

type ApiError = { error?: { message?: string } }

async function readPayload<T>(response: Response) {
  const payload = (await response.json()) as T & ApiError
  if (!response.ok) throw new Error(payload.error?.message ?? 'Request failed.')
  return payload
}

function outcomeClass(outcome: string) {
  if (outcome === 'SUCCESS') return 'status-badge--success'
  if (outcome === 'FAILURE') return 'status-badge--danger'
  return 'status-badge--warning'
}

export function IdentityPlatformAuditConsole() {
  const [rows, setRows] = useState<AuditEvent[]>([])
  const [filters, setFilters] = useState({
    tenantId: '',
    action: '',
    outcome: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ page: '1', pageSize: '100' })
    for (const [key, value] of Object.entries(filters)) {
      if (value.trim()) params.set(key, value.trim())
    }
    try {
      const response = await fetch(`/api/identity/audit-events?${params}`, {
        cache: 'no-store',
      })
      const payload = await readPayload<{ data?: AuditEvent[] }>(response)
      setRows(payload.data ?? [])
    } catch (cause) {
      setRows([])
      setError(
        cause instanceof Error ? cause.message : 'Unable to load audit events.',
      )
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void load()
  }

  return (
    <section
      className="identity-platform-audit"
      aria-label="Platform identity audit"
    >
      <form className="identity-platform-audit__filters" onSubmit={submit}>
        <Filter size={18} aria-hidden="true" />
        <label>
          <span>Tenant ID</span>
          <input
            value={filters.tenantId}
            onChange={(event) =>
              setFilters({ ...filters, tenantId: event.target.value })
            }
            placeholder="Optional tenant UUID"
          />
        </label>
        <label>
          <span>Action</span>
          <input
            value={filters.action}
            onChange={(event) =>
              setFilters({ ...filters, action: event.target.value })
            }
            placeholder="TENANT_CREATED"
          />
        </label>
        <label>
          <span>Outcome</span>
          <select
            value={filters.outcome}
            onChange={(event) =>
              setFilters({ ...filters, outcome: event.target.value })
            }
          >
            <option value="">All outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
          </select>
        </label>
        <Button type="submit" size="small" disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" /> Apply filters
        </Button>
      </form>
      {error && (
        <p className="identity-detail__message is-error" role="alert">
          {error}
        </p>
      )}
      <div className="identity-detail__table-wrap">
        <table className="identity-detail__table identity-platform-audit__table">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Tenant</th>
              <th scope="col">Action</th>
              <th scope="col">Resource</th>
              <th scope="col">Actor</th>
              <th scope="col">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((event) => (
              <tr key={event.id}>
                <td>
                  <time dateTime={event.createdAt}>
                    {new Date(event.createdAt).toLocaleString()}
                  </time>
                </td>
                <td>
                  <strong>{event.tenantName ?? 'Platform'}</strong>
                  <small>{event.tenantKey ?? 'global scope'}</small>
                </td>
                <td>
                  <code>{event.action}</code>
                </td>
                <td>
                  {event.resourceType}
                  <small>{event.resourceId ?? '—'}</small>
                </td>
                <td>
                  <code>{event.actorUserId ?? 'system'}</code>
                </td>
                <td>
                  <span
                    className={`status-badge ${outcomeClass(event.outcome)}`}
                  >
                    {event.outcome}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && (
          <p className="identity-detail__loading" role="status">
            <LoaderCircle className="is-spinning" size={22} /> Loading audit
            events...
          </p>
        )}
        {!loading && !rows.length && (
          <p className="identity-detail__empty">
            <ScrollText size={20} /> No matching audit events.
          </p>
        )}
      </div>
    </section>
  )
}
