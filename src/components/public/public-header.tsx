'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

import { MegaMenu } from '@/components/public/mega-menu'
import { MobileNavigation } from '@/components/public/mobile-navigation'
import { SearchDialog } from '@/components/public/search-dialog'
import { QtsLogo } from '@/components/shared/qts-logo'
import { buttonVariants } from '@/components/ui/button'
import { publicNavigation } from '@/config/marketing'
import { cn } from '@/lib/utils'

export function PublicHeader() {
  const pathname = usePathname()
  const headerRef = useRef<HTMLElement>(null)
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>())
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPointerTypeRef = useRef<string | null>(null)
  const restoreFocusRef = useRef(false)
  const [menuState, setMenuState] = useState<{
    label: string | null
    path: string
  }>({
    label: null,
    path: pathname,
  })
  const activeMenu = menuState.path === pathname ? menuState.label : null
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 72)

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    // Hydration and browser scroll restoration can race the first scroll
    // event, especially when smooth scrolling is enabled on the document.
    const settleTimers = [0, 120, 600].map((delay) =>
      window.setTimeout(onScroll, delay),
    )

    return () => {
      window.removeEventListener('scroll', onScroll)
      settleTimers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  useEffect(() => {
    if (!activeMenu) return

    const onPointerDown = (event: PointerEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setMenuState({ label: null, path: pathname })
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeMenu) {
        const trigger = triggerRefs.current.get(activeMenu)
        restoreFocusRef.current = true
        setMenuState({ label: null, path: pathname })
        trigger?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [activeMenu, pathname])

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    },
    [],
  )

  function openMenu(label: string) {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setMenuState({ label, path: pathname })
  }

  function closeMenu() {
    setMenuState((current) =>
      current.label === null && current.path === pathname
        ? current
        : { label: null, path: pathname },
    )
  }

  function scheduleMenuClose() {
    if (!activeMenu) return
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(closeMenu, 140)
  }

  function focusFirstMenuLink(label: string, menuId: string) {
    setMenuState({ label, path: pathname })
    window.requestAnimationFrame(() => {
      document
        .getElementById(menuId)
        ?.querySelector<HTMLElement>('[data-menu-link]')
        ?.focus()
    })
  }

  return (
    <header
      ref={headerRef}
      className={cn('public-header', scrolled && 'public-header--scrolled')}
    >
      <div className="container public-header__inner">
        <QtsLogo />
        <nav className="desktop-nav" aria-label="Điều hướng chính">
          {publicNavigation.map((item, itemIndex) => {
            const active = item.href
              ? pathname === item.href || pathname.startsWith(`${item.href}/`)
              : false
            const menuId = `public-mega-menu-${itemIndex}`

            if (!item.groups) {
              return (
                <Link
                  key={item.label}
                  href={item.href ?? '/'}
                  className={active ? 'is-active' : undefined}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              )
            }

            const expanded = activeMenu === item.label
            return (
              <div
                className="desktop-nav__item"
                key={item.label}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') openMenu(item.label)
                }}
                onPointerLeave={scheduleMenuClose}
                onBlur={(event) => {
                  if (
                    expanded &&
                    !event.currentTarget.contains(
                      event.relatedTarget as Node | null,
                    )
                  ) {
                    closeMenu()
                  }
                }}
              >
                <button
                  ref={(node) => {
                    if (node) triggerRefs.current.set(item.label, node)
                  }}
                  type="button"
                  className={active ? 'is-active' : undefined}
                  onPointerDown={(event) => {
                    lastPointerTypeRef.current = event.pointerType
                  }}
                  onPointerCancel={() => {
                    lastPointerTypeRef.current = null
                  }}
                  onFocus={() => {
                    if (restoreFocusRef.current) {
                      restoreFocusRef.current = false
                      return
                    }
                    openMenu(item.label)
                  }}
                  onClick={() => {
                    const pointerType = lastPointerTypeRef.current
                    lastPointerTypeRef.current = null

                    if (pointerType === 'mouse') {
                      openMenu(item.label)
                      return
                    }

                    if (expanded) closeMenu()
                    else openMenu(item.label)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault()
                      focusFirstMenuLink(item.label, menuId)
                    }
                  }}
                  aria-expanded={expanded}
                  aria-controls={menuId}
                >
                  {item.label}
                  <ChevronDown
                    size={15}
                    className={expanded ? 'is-rotated' : undefined}
                    aria-hidden="true"
                  />
                </button>
                {expanded && item.href && (
                  <MegaMenu
                    id={menuId}
                    label={item.label}
                    href={item.href}
                    summary={
                      item.description ??
                      `Khám phá các nội dung trong nhóm ${item.label}.`
                    }
                    groups={item.groups}
                  />
                )}
              </div>
            )
          })}
        </nav>
        <div className="public-header__actions">
          <SearchDialog />
          <Link
            className={cn(
              buttonVariants({ variant: 'primary', size: 'small' }),
            )}
            href="/lien-he"
          >
            Nhận tư vấn
          </Link>
          <MobileNavigation />
        </div>
      </div>
      {activeMenu && (
        <button
          className="mega-menu-scrim"
          type="button"
          tabIndex={-1}
          aria-label="Đóng menu"
          onClick={closeMenu}
        />
      )}
    </header>
  )
}
