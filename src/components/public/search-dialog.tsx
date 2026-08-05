'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, Search, X } from 'lucide-react'

import { publicNavigation } from '@/config/marketing'
import { Button } from '@/components/ui/button'

type SearchDialogProps = {
  compact?: boolean
}

export function SearchDialog({ compact = false }: SearchDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const links = useMemo(() => {
    const entries = publicNavigation.flatMap((item) => [
      ...(item.href ? [{ label: item.label, href: item.href }] : []),
      ...(item.groups?.flatMap((group) => group.links) ?? []),
    ])
    const unique = new Map(entries.map((item) => [item.href, item]))
    const normalized = query.trim().toLocaleLowerCase('vi-VN')

    if (!normalized) {
      return Array.from(unique.values()).slice(0, 8)
    }

    return Array.from(unique.values())
      .filter((item) =>
        item.label.toLocaleLowerCase('vi-VN').includes(normalized),
      )
      .slice(0, 10)
  }, [query])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size={compact ? 'small' : 'icon'}
          aria-label="Tìm kiếm trên website"
        >
          <Search size={19} aria-hidden="true" />
          {compact && <span>Tìm kiếm</span>}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="search-dialog">
          <div className="search-dialog__header">
            <div>
              <Dialog.Title>Tìm nội dung QTS</Dialog.Title>
              <Dialog.Description>
                Tìm nhanh dịch vụ, sản phẩm hoặc tài nguyên.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Đóng tìm kiếm">
                <X size={20} aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>
          <label className="search-dialog__field">
            <Search size={19} aria-hidden="true" />
            <span className="sr-only">Từ khóa tìm kiếm</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ví dụ: phát triển phần mềm"
              autoFocus
            />
          </label>
          <div className="search-dialog__results" aria-live="polite">
            {links.length ? (
              links.map((link) => (
                <Dialog.Close asChild key={link.href}>
                  <Link href={link.href}>
                    <span>{link.label}</span>
                    <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </Dialog.Close>
              ))
            ) : (
              <p>Không tìm thấy nội dung phù hợp.</p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
