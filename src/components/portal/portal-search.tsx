'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  accountNavigation,
  adminNavigation,
  portalNavigation,
} from '@/config/portal'
import type { RoleName } from '@/lib/domain/permissions'

export function PortalSearch({ role }: { role: RoleName }) {
  const [query, setQuery] = useState('')
  const entries = useMemo(
    () =>
      [...portalNavigation, ...accountNavigation, ...adminNavigation].filter(
        (item) => (item.roles as readonly string[]).includes(role),
      ),
    [role],
  )
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
          <span>Tìm nhanh trong portal</span>
          <kbd>/</kbd>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="portal-search-dialog">
          <div className="search-dialog__header">
            <div>
              <Dialog.Title>Tìm trong QTS Portal</Dialog.Title>
              <Dialog.Description>
                Đi đến module phù hợp với vai trò của bạn.
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
              autoFocus
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
