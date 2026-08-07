'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  adminSurfaceLinks,
  adminSurfaceNavigation,
} from '@/config/admin-navigation'
import { accountNavigation, portalNavigation } from '@client/config/portal'
import {
  hasPermission,
  permissionForPortalRoute,
  type PermissionSubject,
  type RoleName,
} from '@/lib/domain/permissions'

export function PortalSearch({
  role,
  permissions,
  surface = 'portal',
}: {
  role: RoleName
  permissions?: readonly string[]
  surface?: 'portal' | 'admin'
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const subject = useMemo<PermissionSubject>(
    () => ({ role, permissions }),
    [permissions, role],
  )
  const entries = useMemo(() => {
    if (surface === 'admin') {
      return [...adminSurfaceNavigation, ...adminSurfaceLinks].filter((item) =>
        'permission' in item ? hasPermission(subject, item.permission) : true,
      )
    }
    return [...portalNavigation, ...accountNavigation].filter((item) => {
      const permission = permissionForPortalRoute(item.href)
      if (permission && permissions) return hasPermission(subject, permission)
      return (item.roles as readonly string[]).includes(role)
    })
  }, [permissions, role, subject, surface])
  const results = entries.filter((item) =>
    item.label
      .toLocaleLowerCase('vi-VN')
      .includes(query.trim().toLocaleLowerCase('vi-VN')),
  )

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="portal-search-trigger">
          <Search size={17} aria-hidden="true" />
          <span>
            {surface === 'admin'
              ? 'Tìm nhanh trong quản trị'
              : 'Tìm nhanh trong portal'}
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="portal-search-dialog"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            inputRef.current?.focus()
          }}
        >
          <div className="search-dialog__header">
            <div>
              <Dialog.Title>
                {surface === 'admin'
                  ? 'Tìm trong QTS Admin'
                  : 'Tìm trong QTS Portal'}
              </Dialog.Title>
              <Dialog.Description>
                {surface === 'admin'
                  ? 'Đi đến khu vực quản trị phù hợp với quyền của bạn.'
                  : 'Đi đến module phù hợp với quyền truy cập của bạn.'}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Đóng tìm kiếm">
                <X size={20} />
              </Button>
            </Dialog.Close>
          </div>
          <label className="search-dialog__field">
            <Search size={18} />
            <span className="sr-only">Từ khóa</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Dự án, ticket, hóa đơn..."
            />
          </label>
          <div className="search-dialog__results">
            {results.map((item) => (
              <Dialog.Close asChild key={item.href}>
                <Link href={item.href}>
                  <span>{item.label}</span>
                  <ArrowRight size={16} />
                </Link>
              </Dialog.Close>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
