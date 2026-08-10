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
  '.ecosystem-story__copy',
  '.ecosystem-story__scene-wrap',
  '.ecosystem-story__item',
  '.case-study-rotator',
].join(',')

const REVEAL_THRESHOLD = 0.1
const REVEAL_ROOT_MARGIN = '0px 0px -8% 0px'
const MAX_STAGGER_DELAY_MS = 500
const STAGGER_STEP_MS = 60

function getRevealMotion(item: HTMLElement) {
  if (
    item.matches(
      '.home-hero__visual, .solution-tabs, .contact-cta__form, .ecosystem-story__scene-wrap',
    )
  ) {
    return 'from-right'
  }

  if (item.matches('.contact-cta__copy')) return 'from-left'

  if (item.matches('.stats-grid > *, .blog-grid > *')) {
    return 'zoom'
  }

  return 'rise'
}

function observeRevealItem(observer: IntersectionObserver, item: HTMLElement) {
  observer.observe(item)
}

export function LandingPageReveal({ children }: LandingPageRevealProps) {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // Effects run after the ref is attached to the rendered main element.
    const root = rootRef.current!

    const items: HTMLElement[] = []
    let groupIndex = 0

    for (const element of Array.from(root.children)) {
      if (!(element instanceof HTMLElement) || element.tagName !== 'SECTION') {
        continue
      }

      groupIndex += 1
      element.dataset.revealGroup = String(groupIndex)
      let itemIndex = 0

      for (const item of Array.from(
        element.querySelectorAll<HTMLElement>(REVEAL_ITEM_SELECTOR),
      )) {
        if (item.closest('section[data-reveal-group]') !== element) continue

        item.dataset.revealItem = ''
        itemIndex += 1
        item.dataset.revealOrder = String(itemIndex)
        item.dataset.revealMotion = getRevealMotion(item)
        item.style.setProperty(
          '--reveal-delay',
          `${Math.min((itemIndex - 1) * STAGGER_STEP_MS, MAX_STAGGER_DELAY_MS)}ms`,
        )
        items.push(item)
      }
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const reveal = (item: HTMLElement) => {
      item.dataset.revealState = 'visible'
    }
    const revealAll = () => items.forEach(reveal)

    if (typeof window.IntersectionObserver !== 'function') {
      revealAll()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: REVEAL_ROOT_MARGIN,
        threshold: REVEAL_THRESHOLD,
      },
    )

    if (reducedMotion.matches) {
      revealAll()
    } else {
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
          observeRevealItem(observer, item)
        }
      })
    }

    return () => observer.disconnect()
  }, [])

  return (
    <main id="main-content" data-scroll-reveal ref={rootRef}>
      {children}
    </main>
  )
}
