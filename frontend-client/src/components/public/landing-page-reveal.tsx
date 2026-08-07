'use client'

import { useEffect, useRef, type ReactNode } from 'react'

type LandingPageRevealProps = {
  children: ReactNode
}

const REVEAL_ITEM_SELECTOR = [
  '.home-hero__content > *',
  '.home-hero__visual',
  '.capability-strip__inner > *',
  '.section-heading',
  '.product-catalogue__group',
  '.platform-section__actions',
  '.solution-tabs',
  '.process-timeline > li',
  '.advantages-grid > article',
  '.case-study-grid > *',
  '.stats-section__heading',
  '.stats-grid > *',
  '.blog-grid > *',
  '.section-action',
  '.home-faq > .home-faq__item',
  '.contact-cta__copy',
  '.contact-cta__form',
].join(',')

const REVEAL_THRESHOLD = 0.1
const REVEAL_ROOT_MARGIN = '0px 0px -8% 0px'
const MAX_STAGGER_DELAY_MS = 240
const STAGGER_STEP_MS = 60

function getRevealMotion(item: HTMLElement) {
  if (item.matches('.home-hero__visual, .solution-tabs, .contact-cta__form')) {
    return 'from-right'
  }

  if (item.matches('.contact-cta__copy')) return 'from-left'

  return 'rise'
}

export function LandingPageReveal({ children }: LandingPageRevealProps) {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return () => undefined

    const groups = Array.from(root.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element.tagName === 'SECTION',
    )
    const items = groups.flatMap((group, groupIndex) => {
      group.dataset.revealGroup = String(groupIndex + 1)

      return Array.from(
        group.querySelectorAll<HTMLElement>(REVEAL_ITEM_SELECTOR),
      )
        .filter((item) => item.closest('section[data-reveal-group]') === group)
        .map((item, itemIndex) => {
          item.dataset.revealItem = ''
          item.dataset.revealOrder = String(itemIndex + 1)
          item.dataset.revealMotion = getRevealMotion(item)
          item.style.setProperty(
            '--reveal-delay',
            `${Math.min(itemIndex * STAGGER_STEP_MS, MAX_STAGGER_DELAY_MS)}ms`,
          )
          return item
        })
    })
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let observer: IntersectionObserver | null = null

    const reveal = (item: HTMLElement) => {
      item.dataset.revealState = 'visible'
      observer?.unobserve(item)
    }
    const revealAll = () => items.forEach(reveal)
    const handleReducedMotion = (event: MediaQueryListEvent) => {
      if (event.matches) {
        observer?.disconnect()
        revealAll()
      }
    }

    reducedMotion.addEventListener('change', handleReducedMotion)

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      revealAll()
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) reveal(entry.target as HTMLElement)
          })
        },
        {
          rootMargin: REVEAL_ROOT_MARGIN,
          threshold: REVEAL_THRESHOLD,
        },
      )

      const initialRevealBoundary = window.innerHeight * 0.92
      const measuredItems = items.map((item) => ({
        bounds: item.getBoundingClientRect(),
        item,
      }))

      measuredItems.forEach(({ bounds, item }) => {
        if (bounds.top < initialRevealBoundary && bounds.bottom > 0) {
          reveal(item)
        } else {
          item.dataset.revealState = 'pending'
          observer?.observe(item)
        }
      })
    }

    return () => {
      reducedMotion.removeEventListener('change', handleReducedMotion)
      observer?.disconnect()
    }
  }, [])

  return (
    <main id="main-content" data-scroll-reveal ref={rootRef}>
      {children}
    </main>
  )
}
