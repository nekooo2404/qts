'use client'

import { useState } from 'react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDown, Menu, X } from 'lucide-react'

import { QtsLogo } from '@/components/shared/qts-logo'
import { Button, buttonVariants } from '@/components/ui/button'
import { publicNavigation } from '@/config/marketing'
import { cn } from '@/lib/utils'
import { SearchDialog } from '@/components/public/search-dialog'

export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          className="mobile-nav-trigger"
          variant="ghost"
          size="icon"
          aria-label="Mở menu điều hướng"
        >
          <Menu size={21} aria-hidden="true" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="mobile-nav">
          <Dialog.Title className="sr-only">Điều hướng QTS</Dialog.Title>
          <div className="mobile-nav__header">
            <QtsLogo />
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Đóng menu">
                <X size={21} aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="mobile-nav__tools">
            <SearchDialog compact />
          </div>
          <nav className="mobile-nav__links" aria-label="Điều hướng di động">
            {publicNavigation.map((item) => {
              if (!item.groups) {
                return (
                  <Dialog.Close asChild key={item.label}>
                    <Link
                      className="mobile-nav__direct"
                      href={item.href ?? '/'}
                    >
                      {item.label}
                    </Link>
                  </Dialog.Close>
                )
              }

              const isExpanded = expanded === item.label
              return (
                <div className="mobile-nav__section" key={item.label}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : item.label)}
                    aria-expanded={isExpanded}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      size={18}
                      className={isExpanded ? 'is-rotated' : undefined}
                      aria-hidden="true"
                    />
                  </button>
                  {isExpanded && (
                    <div className="mobile-nav__panel">
                      {item.href && (
                        <Dialog.Close asChild>
                          <Link
                            className="mobile-nav__overview"
                            href={item.href}
                          >
                            Tổng quan {item.label}
                          </Link>
                        </Dialog.Close>
                      )}
                      {item.groups.map((group) => (
                        <section key={group.title}>
                          <h3>{group.title}</h3>
                          {group.links.map((link) => (
                            <Dialog.Close
                              asChild
                              key={`${group.title}-${link.label}-${link.href}`}
                            >
                              <Link href={link.href}>{link.label}</Link>
                            </Dialog.Close>
                          ))}
                        </section>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
          <div className="mobile-nav__actions">
            <Dialog.Close asChild>
              <Link
                className={cn(buttonVariants({ variant: 'primary' }))}
                href="/lien-he"
              >
                Nhận tư vấn
              </Link>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
