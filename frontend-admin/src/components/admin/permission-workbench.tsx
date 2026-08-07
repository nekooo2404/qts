'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  LoaderCircle,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  FormFeedback,
  type FormFeedbackValue,
} from '@client/components/portal/form-feedback'
import {
  applyPermissionDenials,
  expandPermissionKeys,
} from '@/lib/domain/permissions'
import { cn } from '@/lib/utils'

type PermissionEffect = 'ALLOW' | 'DENY'
type PermissionMode = PermissionEffect | 'INHERIT'

export type PermissionCatalogItem = {
  key: string
  label: string
  description: string
  module: string
  action: string
}

export type PermissionUser = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

type PermissionState = {
  user: PermissionUser
  effectiveKeys: string[]
  overrides: Array<{ key: string; effect: PermissionEffect }>
  permissions: Array<
    PermissionCatalogItem & {
      roleDefault: boolean
      override: PermissionEffect | null
      effective: boolean
    }
  >
}

const localLabels: Record<string, string> = {
  'portal.dashboard.read': 'Xem tổng quan',
  'portal.projects.read': 'Xem dự án',
  'portal.projects.read.all': 'Xem mọi dự án',
  'portal.projects.assign.all': 'Gán dự án cho mọi tổ chức',
  'portal.projects.create': 'Tạo dự án',
  'portal.projects.update': 'Cập nhật dự án',
  'portal.projects.delete': 'Xóa dự án',
  'portal.tasks.read': 'Xem công việc',
  'portal.tasks.read.all': 'Xem mọi công việc',
  'portal.tasks.create': 'Tạo công việc',
  'portal.tasks.update': 'Cập nhật công việc',
  'portal.tickets.read': 'Xem ticket',
  'portal.tickets.read.all': 'Xem mọi ticket',
  'portal.tickets.create': 'Tạo ticket',
  'portal.tickets.reply': 'Phản hồi ticket',
  'portal.tickets.manage': 'Điều phối ticket',
  'portal.documents.read': 'Xem tài liệu',
  'portal.documents.read.all': 'Xem mọi tài liệu',
  'portal.documents.upload': 'Tải tài liệu lên',
  'portal.documents.upload.all': 'Tải tài liệu lên mọi tổ chức',
  'portal.documents.download': 'Tải tài liệu xuống',
  'portal.contracts.read': 'Xem hợp đồng',
  'portal.contracts.read.all': 'Xem mọi hợp đồng',
  'portal.contracts.download': 'Tải hợp đồng xuống',
  'portal.invoices.read': 'Xem hóa đơn',
  'portal.invoices.read.all': 'Xem mọi hóa đơn',
  'portal.invoices.download': 'Tải hóa đơn xuống',
  'portal.notifications.read': 'Xem thông báo',
  'portal.notifications.manage': 'Đánh dấu thông báo đã đọc',
  'portal.notifications.compose': 'Gửi thông báo cho khách hàng',
  'portal.notifications.compose.all': 'Gửi thông báo cho mọi tài khoản',
  'portal.announcements.read': 'Xem bảng tin',
  'portal.announcements.manage': 'Quản lý bảng tin',
  'portal.profile.read': 'Xem hồ sơ',
  'portal.profile.update': 'Cập nhật hồ sơ',
  'portal.settings.read': 'Xem cài đặt',
  'portal.settings.update': 'Cập nhật cài đặt',
  'admin.access': 'Mở khu vực quản trị',
  'admin.dashboard.read': 'Xem tổng quan quản trị',
  'admin.users.read': 'Xem người dùng',
  'admin.users.update': 'Cập nhật người dùng',
  'admin.permissions.read': 'Xem chính sách quyền',
  'admin.permissions.manage': 'Điều chỉnh quyền tài khoản',
  'admin.content.read': 'Xem nội dung CMS',
  'admin.content.write': 'Biên tập nội dung CMS',
  'admin.audit.read': 'Xem nhật ký audit',
}

const moduleLabels: Record<string, string> = {
  'portal.dashboard': 'Tổng quan',
  'portal.projects': 'Dự án',
  'portal.tasks': 'Công việc',
  'portal.tickets': 'Ticket hỗ trợ',
  'portal.documents': 'Tài liệu',
  'portal.contracts': 'Hợp đồng',
  'portal.invoices': 'Hóa đơn',
  'portal.notifications': 'Thông báo',
  'portal.announcements': 'Bảng tin',
  'portal.profile': 'Hồ sơ',
  'portal.settings': 'Cài đặt',
  admin: 'Khu vực quản trị',
  'admin.dashboard': 'Tổng quan quản trị',
  'admin.tickets': 'Ticket quản trị',
  'admin.leads': 'Lead liên hệ',
  'admin.users': 'Người dùng',
  'admin.permissions': 'Quyền truy cập',
  'admin.content': 'Nội dung',
  'admin.audit': 'Nhật ký audit',
}

function roleLabel(role: string) {
  return (
    { ADMIN: 'Quản trị viên', STAFF: 'Nhân sự QTS', CUSTOMER: 'Khách hàng' }[
      role
    ] ?? role
  )
}

export function PermissionWorkbench({
  users,
  catalog,
  initialUserId,
  canManage = true,
}: {
  users: PermissionUser[]
  catalog: PermissionCatalogItem[]
  initialUserId?: string
  canManage?: boolean
}) {
  const [selectedId, setSelectedId] = useState(
    initialUserId && users.some((user) => user.id === initialUserId)
      ? initialUserId
      : (users[0]?.id ?? ''),
  )
  const [state, setState] = useState<PermissionState | null>(null)
  const [draft, setDraft] = useState<Record<string, PermissionMode>>({})
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedbackValue>(null)

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    fetch(`/api/admin/users/${selectedId}/permissions`)
      .then(async (response) => {
        const payload = (await response.json()) as {
          data?: PermissionState
          message?: string
        }
        if (!response.ok || !payload.data) {
          throw new Error(payload.message ?? 'Không thể tải chính sách quyền.')
        }
        if (cancelled) return
        setState(payload.data)
        setDraft(
          Object.fromEntries(
            catalog.map((item) => [
              item.key,
              payload.data?.permissions.find(
                (permission) => permission.key === item.key,
              )?.override ?? 'INHERIT',
            ]),
          ),
        )
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState(null)
          setFeedback({
            type: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Không thể tải chính sách quyền.',
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [catalog, selectedId])

  const loading = Boolean(selectedId && state?.user.id !== selectedId)

  const filteredCatalog = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi-VN')
    if (!normalized) return catalog
    return catalog.filter((item) =>
      `${localLabels[item.key] ?? item.label} ${item.key} ${item.description}`
        .toLocaleLowerCase('vi-VN')
        .includes(normalized),
    )
  }, [catalog, query])

  const groups = useMemo(() => {
    const grouped = new Map<string, PermissionCatalogItem[]>()
    filteredCatalog.forEach((item) => {
      const current = grouped.get(item.module) ?? []
      current.push(item)
      grouped.set(item.module, current)
    })
    return [...grouped.entries()]
  }, [filteredCatalog])

  const roleDefaultKeys = new Set(
    state?.permissions
      .filter((permission) => permission.roleDefault)
      .map((permission) => permission.key),
  )
  const directEffectiveKeys = Object.entries(draft)
    .filter(
      ([key, mode]) =>
        mode === 'ALLOW' || (mode === 'INHERIT' && roleDefaultKeys.has(key)),
    )
    .map(([key]) => key)
  const effectiveKeys = expandPermissionKeys(directEffectiveKeys)
  applyPermissionDenials(
    effectiveKeys,
    Object.entries(draft)
      .filter(([, mode]) => mode === 'DENY')
      .map(([key]) => key),
  )
  const effectiveCount = catalog.filter((item) =>
    effectiveKeys.has(item.key),
  ).length
  const overrideCount = Object.values(draft).filter(
    (mode) => mode !== 'INHERIT',
  ).length

  function setMode(key: string, mode: PermissionMode) {
    setDraft((current) => ({ ...current, [key]: mode }))
    setFeedback(null)
  }

  function resetDraft() {
    if (!state) return
    setDraft(
      Object.fromEntries(
        catalog.map((item) => [
          item.key,
          state.permissions.find((permission) => permission.key === item.key)
            ?.override ?? 'INHERIT',
        ]),
      ),
    )
    setFeedback(null)
  }

  async function save() {
    if (!selectedId) return
    setPending(true)
    setFeedback(null)
    const overrides = Object.entries(draft)
      .filter(([, effect]) => effect !== 'INHERIT')
      .map(([key, effect]) => ({ key, effect }))
    try {
      const response = await fetch(
        `/api/admin/users/${selectedId}/permissions`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ overrides }),
        },
      )
      const payload = (await response.json()) as {
        data?: PermissionState
        message?: string
      }
      if (!response.ok || !payload.data) {
        throw new Error(payload.message ?? 'Không thể lưu chính sách quyền.')
      }
      setState(payload.data)
      setFeedback({
        type: 'success',
        message: 'Đã lưu quyền truy cập cho tài khoản.',
      })
    } catch (error: unknown) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Không thể lưu chính sách quyền.',
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      className="permission-workbench"
      aria-label="Điều chỉnh quyền theo tài khoản"
    >
      <div className="permission-workbench__accounts portal-panel">
        <header className="portal-panel__header">
          <div>
            <h2>Tài khoản</h2>
            <p>{users.length} tài khoản trong hệ thống</p>
          </div>
          <ShieldAlert size={18} aria-hidden="true" />
        </header>
        <div className="permission-account-list">
          {users.map((user) => (
            <button
              type="button"
              className={cn(
                'permission-account',
                selectedId === user.id && 'is-active',
              )}
              key={user.id}
              onClick={() => {
                setSelectedId(user.id)
                setFeedback(null)
              }}
            >
              <span className="permission-account__avatar">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="permission-account__copy">
                <strong>{user.name}</strong>
                <small>{user.email}</small>
                <em>{roleLabel(user.role)}</em>
              </span>
              <span
                className={cn(
                  'permission-account__status',
                  !user.active && 'is-inactive',
                )}
              >
                {user.active ? 'Đang dùng' : 'Đã khóa'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="permission-workbench__policy">
        <header className="portal-page-header">
          <div>
            <span>Per-user access</span>
            <h1>Quyền truy cập</h1>
            <p>
              {state
                ? `${state.user.name} · ${roleLabel(state.user.role)}`
                : 'Chọn một tài khoản để xem chính sách hiệu lực.'}
            </p>
          </div>
          <div className="portal-page-header__actions">
            <Button
              variant="secondary"
              onClick={resetDraft}
              disabled={!state || loading || pending}
            >
              <RotateCcw size={16} aria-hidden="true" /> Hoàn tác
            </Button>
            <Button
              onClick={save}
              disabled={!canManage || !state || loading || pending}
            >
              {pending ? (
                <LoaderCircle
                  className="is-spinning"
                  size={16}
                  aria-hidden="true"
                />
              ) : (
                <Save size={16} aria-hidden="true" />
              )}
              {pending ? 'Đang lưu...' : canManage ? 'Lưu quyền' : 'Chỉ xem'}
            </Button>
          </div>
        </header>

        <div className="permission-summary" aria-live="polite">
          <div>
            <strong>{effectiveCount}</strong>
            <span>Quyền hiệu lực</span>
          </div>
          <div>
            <strong>{overrideCount}</strong>
            <span>Override riêng</span>
          </div>
          <div>
            <strong>{state?.user.role ?? '—'}</strong>
            <span>Role nền</span>
          </div>
        </div>

        <label className="permission-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Tìm quyền</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo module hoặc hành động"
          />
        </label>

        <FormFeedback value={feedback} />

        {loading ? (
          <div className="permission-loading" role="status">
            <LoaderCircle className="is-spinning" size={22} /> Đang tải chính
            sách...
          </div>
        ) : state ? (
          <div className="permission-groups">
            {groups.map(([module, items]) => (
              <section className="permission-group portal-panel" key={module}>
                <header className="portal-panel__header">
                  <div>
                    <h2>{moduleLabels[module] ?? module}</h2>
                    <p>{items.length} quyền trong module này</p>
                  </div>
                </header>
                <div className="permission-list">
                  {items.map((item) => {
                    const mode = draft[item.key] ?? 'INHERIT'
                    const effective = effectiveKeys.has(item.key)
                    return (
                      <article className="permission-row" key={item.key}>
                        <div className="permission-row__copy">
                          <strong>{localLabels[item.key] ?? item.label}</strong>
                          <small>{item.description}</small>
                          <code>{item.key}</code>
                        </div>
                        <span
                          className={cn(
                            'permission-effective',
                            effective && 'is-allowed',
                          )}
                        >
                          {effective ? (
                            <Check size={14} aria-hidden="true" />
                          ) : null}
                          {effective ? 'Được phép' : 'Bị chặn'}
                        </span>
                        <div
                          className="permission-mode"
                          role="group"
                          aria-label={`Chính sách ${localLabels[item.key] ?? item.label}`}
                        >
                          {(['INHERIT', 'ALLOW', 'DENY'] as const).map(
                            (option) => (
                              <button
                                type="button"
                                key={option}
                                disabled={!canManage}
                                className={cn(
                                  mode === option && 'is-selected',
                                  option === 'DENY' &&
                                    mode === option &&
                                    'is-danger',
                                )}
                                aria-pressed={mode === option}
                                onClick={() => setMode(item.key, option)}
                              >
                                {option === 'INHERIT'
                                  ? 'Theo role'
                                  : option === 'ALLOW'
                                    ? 'Cho phép'
                                    : 'Từ chối'}
                              </button>
                            ),
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
            {!groups.length && (
              <p className="portal-panel__empty">
                Không tìm thấy quyền phù hợp.
              </p>
            )}
          </div>
        ) : (
          <div className="portal-panel permission-empty">
            <ShieldAlert size={22} />
            <p>Chưa tải được chính sách quyền.</p>
          </div>
        )}
      </div>
    </section>
  )
}
