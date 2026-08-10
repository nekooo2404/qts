import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const viewports = [
  { width: 320, height: 800 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 1000 },
  { width: 1920, height: 1080 },
]

const compactViewports = [
  { width: 320, height: 800 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
]

const publicCopyRoutes = [
  '/',
  '/bao-gia',
  '/blog',
  '/blog/chon-lo-trinh-chuyen-doi-so-phu-hop',
  '/blog/bao-mat-theo-tung-lop-trong-phan-mem-doanh-nghiep',
  '/blog/thiet-ke-trai-nghiem-cho-cong-cu-van-hanh',
  '/dich-vu',
  '/dich-vu/thiet-ke-website',
  '/dich-vu/phat-trien-phan-mem',
  '/dich-vu/tich-hop-he-thong',
  '/dich-vu/bao-tri-van-hanh',
  '/du-an',
  '/du-an/nen-tang-van-hanh-doanh-nghiep-mau',
  '/du-an/cong-thong-tin-giao-duc-mau',
  '/du-an/thuong-mai-va-quan-ly-don-hang-mau',
  '/giai-phap',
  '/giai-phap/doanh-nghiep',
  '/giai-phap/giao-duc',
  '/giai-phap/thuong-mai',
  '/giai-phap/co-quan-to-chuc',
  '/lien-he',
  '/gioi-thieu',
  '/san-pham',
  '/san-pham/qts-portal',
  '/san-pham/qts-crm',
  '/san-pham/qts-work',
  '/tuyen-dung',
  '/chinh-sach-bao-mat',
  '/dieu-khoan-su-dung',
]

const unverifiedCopyPattern =
  /\[(?:Điền|Khách hàng|Tổ chức|Doanh nghiệp|Đơn vị|Dự án|Mô tả|Kết quả|Địa chỉ|Website|Trích dẫn|Vai trò|Phản hồi)[^\]]*\]/iu
const inventedMetricPattern = /\b\d{1,3}\s*%/u

test('homepage passes automated WCAG A/AA checks', async ({ page }) => {
  await page.goto('/')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(results.violations).toEqual([])
})

test('homepage stays in-bounds after the hero visual is removed', async ({
  page,
}) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const geometry = await page.evaluate(() => {
      const overflow = [...document.querySelectorAll<HTMLElement>('body *')]
        .filter(
          (element) =>
            !element.closest('.honeypot') &&
            element.tagName !== 'NEXTJS-PORTAL',
        )
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return {
            selector: `${element.tagName.toLowerCase()}.${element.className}`,
            left: rect.left,
            right: rect.right,
          }
        })
        .filter(({ left, right }) => left < -1 || right > innerWidth + 1)

      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        hasHeroVisual: Boolean(document.querySelector('.home-hero__visual')),
        overflow,
      }
    })

    expect(
      geometry.documentWidth,
      `${viewport.width}x${viewport.height} document width`,
    ).toBe(geometry.viewportWidth)
    expect(
      geometry.overflow,
      `${viewport.width}x${viewport.height} overflow`,
    ).toEqual([])
    expect(
      geometry.hasHeroVisual,
      `${viewport.width}x${viewport.height} hero visual should be absent`,
    ).toBe(false)
  }
})

test('landing page reveals related content items in a staged sequence', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.waitForTimeout(700)

  const groups = page.locator(
    'main[data-scroll-reveal] > section[data-reveal-group]',
  )
  await expect(groups.first()).toHaveAttribute('data-reveal-group', '1')
  expect(await groups.count()).toBeGreaterThan(8)

  const items = page.locator('main[data-scroll-reveal] [data-reveal-item]')
  await expect(items.first()).toHaveAttribute('data-reveal-state', 'visible')
  expect(await items.count()).toBeGreaterThan(24)

  const platform = page.locator('.platform-section')
  const productGroups = platform.locator(
    '.product-catalogue__group[data-reveal-item]',
  )
  expect(await productGroups.count()).toBeGreaterThan(3)

  const firstProductGroup = productGroups.first()
  const lastProductGroup = productGroups.last()
  await expect(firstProductGroup).toHaveAttribute(
    'data-reveal-state',
    'pending',
  )
  await expect(lastProductGroup).toHaveAttribute('data-reveal-state', 'pending')
  await expect(firstProductGroup).toHaveCSS('opacity', '0')

  const layoutBefore = await platform.evaluate((element) => ({
    offsetHeight: (element as HTMLElement).offsetHeight,
    offsetTop: (element as HTMLElement).offsetTop,
  }))

  await firstProductGroup.scrollIntoViewIfNeeded()
  await expect(firstProductGroup).toHaveAttribute(
    'data-reveal-state',
    'visible',
  )
  await expect(firstProductGroup).toHaveCSS('opacity', '1')
  await expect(lastProductGroup).toHaveAttribute('data-reveal-state', 'pending')

  await lastProductGroup.scrollIntoViewIfNeeded()
  await expect(lastProductGroup).toHaveAttribute('data-reveal-state', 'visible')

  const layoutAfter = await platform.evaluate((element) => ({
    offsetHeight: (element as HTMLElement).offsetHeight,
    offsetTop: (element as HTMLElement).offsetTop,
  }))
  expect(layoutAfter).toEqual(layoutBefore)

  const revealOrders = await productGroups.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-reveal-order')),
  )
  expect(new Set(revealOrders).size).toBeGreaterThan(2)

  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(firstProductGroup).toHaveAttribute(
    'data-reveal-state',
    'visible',
  )
})

test('ecosystem accordion stays available without the spatial scene', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')

  const story = page.locator('#he-sinh-thai-tuong-tac')
  await story.scrollIntoViewIfNeeded()

  const triggers = story.locator('.ecosystem-story__tab')
  const panels = story.locator('.ecosystem-story__panel')
  expect(await triggers.count()).toBe(3)
  await expect(triggers.nth(0)).toHaveAttribute('aria-expanded', 'true')
  await expect(triggers.nth(1)).toHaveAttribute('aria-expanded', 'false')
  await expect(panels.nth(0)).toHaveCSS('display', 'grid')
  await expect
    .poll(() =>
      panels
        .nth(1)
        .evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(0)

  await triggers.nth(1).click()
  await expect(triggers.nth(1)).toHaveAttribute('aria-expanded', 'true')
  await expect(triggers.nth(0)).toHaveAttribute('aria-expanded', 'false')
  await expect(story.locator('.ecosystem-story__scene')).toHaveCount(0)

  await triggers.nth(2).focus()
  await page.keyboard.press('ArrowLeft')
  await expect(triggers.nth(1)).toBeFocused()

  const pause = page.locator('.case-study-rotator__pause')
  await pause.scrollIntoViewIfNeeded()
  await pause.click()
  await expect(pause).toHaveAttribute('aria-pressed', 'true')
  await expect(pause).toHaveAccessibleName('Tiếp tục tự động chuyển tình huống')
})

test('landing page keeps reveal items visible with reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')

  const items = page.locator('main[data-scroll-reveal] [data-reveal-item]')
  await expect(items.first()).toHaveAttribute('data-reveal-state', 'visible')
  expect(await items.count()).toBeGreaterThan(24)

  for (const item of await items.all()) {
    await expect(item).toHaveAttribute('data-reveal-state', 'visible')
    await expect(item).toHaveCSS('opacity', '1')
  }
})

test('landing page content remains available without client JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()

  try {
    await page.goto('/')
    const sections = page.locator('main#main-content > section')
    const solutions = page.locator('.solutions-section')
    const contact = page.locator('.contact-cta')

    expect(await sections.count()).toBeGreaterThan(8)
    await expect(solutions).toContainText('Bắt đầu từ nút thắt vận hành')
    await expect(contact).toContainText('Bắt đầu dự án công nghệ cùng QTS')

    for (const section of [solutions, contact]) {
      const styles = await section.evaluate((element) => {
        const computed = getComputedStyle(element)
        return {
          display: computed.display,
          opacity: computed.opacity,
          visibility: computed.visibility,
        }
      })

      expect(styles.display).not.toBe('none')
      expect(styles.opacity).toBe('1')
      expect(styles.visibility).toBe('visible')
    }
  } finally {
    await context.close()
  }
})

test('hero decisions remain centered and geometrically aligned', async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 780 },
    { width: 375, height: 812 },
    { width: 768, height: 900 },
    { width: 1280, height: 800 },
    { width: 1920, height: 1000 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const heroButtons = page.locator('.home-hero__actions .button')
    await expect(heroButtons.first()).toBeVisible()
    await expect(heroButtons.last()).toBeVisible()

    const geometry = await page.locator('.home-hero').evaluate((hero) => {
      const content = hero.querySelector<HTMLElement>('.home-hero__content')
      const actions = hero.querySelector<HTMLElement>('.home-hero__actions')
      const buttons = Array.from(
        hero.querySelectorAll<HTMLElement>('.home-hero__actions .button'),
      )
      const contentRect = content?.getBoundingClientRect()
      const buttonRects = buttons.map((button) =>
        button.getBoundingClientRect(),
      )
      const groupLeft = Math.min(...buttonRects.map((rect) => rect.left))
      const groupRight = Math.max(...buttonRects.map((rect) => rect.right))

      return {
        buttonHeights: buttonRects.map((rect) => rect.height),
        buttonTops: buttonRects.map((rect) => rect.top),
        centerDelta:
          (groupLeft + groupRight) / 2 -
          ((contentRect?.left ?? 0) + (contentRect?.right ?? 0)) / 2,
        flexDirection: actions ? getComputedStyle(actions).flexDirection : '',
        whiteSpace: buttons.map(
          (button) => getComputedStyle(button).whiteSpace,
        ),
      }
    })

    expect(
      Math.abs(geometry.centerDelta),
      `${viewport.width}px hero decisions are off-center`,
    ).toBeLessThanOrEqual(1)
    expect(new Set(geometry.buttonHeights).size).toBe(1)
    expect(Math.min(...geometry.buttonHeights)).toBeGreaterThanOrEqual(44)
    expect(geometry.whiteSpace).toEqual(['nowrap', 'nowrap'])

    if (geometry.flexDirection === 'row') {
      expect(
        Math.max(...geometry.buttonTops) - Math.min(...geometry.buttonTops),
      ).toBeLessThanOrEqual(1)
    }
  }
})

test('homepage affordances use direction-aware motion feedback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')

  const primaryDecision = page.locator('.home-hero__decision--primary')
  const ecosystemDecision = page.locator('.home-hero__decision--ecosystem')
  await expect(primaryDecision).toBeVisible()
  await expect(ecosystemDecision).toBeVisible()

  await primaryDecision.hover()
  await expect
    .poll(() =>
      primaryDecision
        .locator('svg')
        .evaluate(
          (icon) => new DOMMatrix(getComputedStyle(icon).transform).m41,
        ),
    )
    .toBeGreaterThanOrEqual(3)

  await ecosystemDecision.hover()
  await expect
    .poll(() =>
      ecosystemDecision
        .locator('svg')
        .evaluate(
          (icon) => new DOMMatrix(getComputedStyle(icon).transform).m42,
        ),
    )
    .toBeGreaterThanOrEqual(3)

  const productCard = page.locator('.product-card').first()
  await productCard.scrollIntoViewIfNeeded()
  await productCard.hover()
  await expect
    .poll(() =>
      productCard
        .locator('.product-card__arrow')
        .evaluate(
          (icon) => new DOMMatrix(getComputedStyle(icon).transform).m41,
        ),
    )
    .toBeGreaterThanOrEqual(3)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await primaryDecision.hover()
  const reducedMotionShift = await primaryDecision
    .locator('svg')
    .evaluate((icon) => new DOMMatrix(getComputedStyle(icon).transform).m41)
  expect(reducedMotionShift).toBe(0)
})

test('header changes mode before desktop navigation can overlap actions', async ({
  page,
}) => {
  for (const width of [1121, 1200, 1260, 1280]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')

    const geometry = await page.evaluate(() => {
      const nav = document.querySelector<HTMLElement>('.desktop-nav')
      const actions = document.querySelector<HTMLElement>(
        '.public-header__actions',
      )
      const mobileTrigger = document.querySelector<HTMLElement>(
        '.mobile-nav-trigger',
      )
      const headerInner = document.querySelector<HTMLElement>(
        '.public-header__inner',
      )
      const navRect = nav?.getBoundingClientRect()
      const actionRect = actions?.getBoundingClientRect()
      const headerRect = headerInner?.getBoundingClientRect()

      return {
        navDisplay: nav ? getComputedStyle(nav).display : 'missing',
        mobileTriggerDisplay: mobileTrigger
          ? getComputedStyle(mobileTrigger).display
          : 'missing',
        navRight: navRect?.right ?? 0,
        actionsLeft: actionRect?.left ?? 0,
        actionsRight: actionRect?.right ?? 0,
        headerRight: headerRect?.right ?? 0,
      }
    })

    if (width < 1280) {
      expect(geometry.navDisplay, `${width}px desktop nav`).toBe('none')
      expect(
        geometry.mobileTriggerDisplay,
        `${width}px mobile navigation trigger`,
      ).not.toBe('none')
      expect(
        geometry.actionsRight,
        `${width}px mobile actions are not aligned to the right edge`,
      ).toBeCloseTo(geometry.headerRight, 0)
    } else {
      expect(
        geometry.navRight,
        `${width}px desktop nav overlaps actions`,
      ).toBeLessThanOrEqual(geometry.actionsLeft + 1)
    }
  }
})

test('scrolled desktop header masks content beneath the floating navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.evaluate(() => window.scrollTo(0, 180))

  const header = page.locator('.public-header')
  await expect(header).toHaveClass(/public-header--scrolled/)

  const geometry = await header.evaluate((element) => {
    const inner = element.querySelector<HTMLElement>('.public-header__inner')
    const logo = element.querySelector<HTMLElement>('.qts-logo')
    const actions = element.querySelector<HTMLElement>(
      '.public-header__actions',
    )
    const headerRect = element.getBoundingClientRect()
    const innerRect = inner?.getBoundingClientRect()
    const logoRect = logo?.getBoundingClientRect()
    const actionsRect = actions?.getBoundingClientRect()

    return {
      backgroundColor: getComputedStyle(element).backgroundColor,
      headerTop: headerRect.top,
      headerBottom: headerRect.bottom,
      innerTop: innerRect?.top ?? Number.NEGATIVE_INFINITY,
      innerBottom: innerRect?.bottom ?? Number.POSITIVE_INFINITY,
      leftInset:
        (logoRect?.left ?? Number.NEGATIVE_INFINITY) -
        (innerRect?.left ?? Number.POSITIVE_INFINITY),
      rightInset:
        (innerRect?.right ?? Number.NEGATIVE_INFINITY) -
        (actionsRect?.right ?? Number.POSITIVE_INFINITY),
    }
  })

  expect(geometry.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  expect(geometry.innerTop).toBeGreaterThanOrEqual(geometry.headerTop)
  expect(geometry.innerBottom).toBeLessThanOrEqual(geometry.headerBottom)
  expect(geometry.leftInset).toBeGreaterThanOrEqual(16)
  expect(geometry.rightInset).toBeGreaterThanOrEqual(16)
})

test('public routes stay within the viewport on compact mobile screens', async ({
  page,
}) => {
  for (const route of publicCopyRoutes) {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto(route)
    await expect(page.locator('main:not(.route-loading)')).toBeVisible()

    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('body *')]
        .filter(
          (element) =>
            !element.closest('.honeypot') &&
            element.tagName !== 'NEXTJS-PORTAL' &&
            element.tagName !== 'SCRIPT' &&
            element.tagName !== 'STYLE',
        )
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return {
            selector: `${element.tagName.toLowerCase()}.${element.className}`,
            left: rect.left,
            right: rect.right,
          }
        })
        .filter(({ left, right }) => left < -1 || right > innerWidth + 1),
    )

    expect(overflow, `${route} overflows at 320px`).toEqual([])
  }
})

test('hero keeps its content and actions after the spatial visual is removed', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')

  await expect(page.locator('.home-hero__visual')).toHaveCount(0)
  await expect(page.locator('.home-hero__content h1')).toBeVisible()
  await expect(page.locator('.home-hero__actions')).toBeVisible()

  const hero = await page.locator('.home-hero').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const content = element.querySelector('.home-hero__content')
    const contentRect = content?.getBoundingClientRect()
    return {
      height: rect.height,
      contentWidth: contentRect?.width ?? 0,
      viewportWidth: window.innerWidth,
    }
  })

  expect(hero.contentWidth).toBeGreaterThan(0)
  expect(hero.contentWidth).toBeLessThanOrEqual(hero.viewportWidth)
  expect(hero.height).toBeLessThan(800)
})

test('public marketing routes contain no unverified placeholders or invented metrics', async ({
  page,
}) => {
  for (const route of publicCopyRoutes) {
    await page.goto(route)
    await expect(page.locator('main:not(.route-loading)')).toBeVisible()
    const bodyText = await page.locator('body').innerText()

    expect(bodyText, `${route} contains an unverified placeholder`).not.toMatch(
      unverifiedCopyPattern,
    )
    expect(
      bodyText,
      `${route} contains an invented percentage metric`,
    ).not.toMatch(inventedMetricPattern)
    expect(
      bodyText,
      `${route} contains the retired demo case label`,
    ).not.toMatch(/DEMO\s*\//u)
  }
})

test('unfinished customer proof route redirects to illustrative projects', async ({
  page,
}) => {
  await page.goto('/khach-hang')
  await expect(page).toHaveURL(/\/du-an\/?$/)
  await expect(page.locator('main:not(.route-loading)')).toBeVisible()
})

test('homepage FAQ exposes accessible disclosure controls with 44px buttons', async ({
  page,
}) => {
  await page.setViewportSize({ width: 414, height: 896 })
  await page.goto('/')

  const items = page.locator('.home-faq__item')
  await expect(items.first()).toBeVisible()
  expect(
    await items.count(),
    'homepage FAQ should expose multiple questions',
  ).toBeGreaterThanOrEqual(3)

  const firstItem = items.first()
  const firstButton = firstItem.getByRole('button')
  const firstQuestion = firstItem.locator('h3')
  await expect(firstQuestion).toBeVisible()
  await expect(firstButton).toHaveAttribute('aria-expanded', 'true')
  expect(
    await page.locator('.home-faq__question-row button h3').count(),
    'question headings must remain outside the disclosure button',
  ).toBe(0)

  const firstAnswerId = await firstButton.getAttribute('aria-controls')
  if (!firstAnswerId) throw new Error('FAQ button is missing aria-controls')
  const firstQuestionId = await firstQuestion.getAttribute('id')
  if (!firstQuestionId) throw new Error('FAQ heading is missing an id')
  const firstAnswer = page.locator(`#${firstAnswerId}`)
  await expect(firstAnswer).toHaveAttribute('role', 'region')
  await expect(firstAnswer).toHaveAttribute('aria-labelledby', firstQuestionId)
  await expect(firstAnswer).toBeVisible()

  const secondItem = items.nth(1)
  const secondButton = secondItem.getByRole('button')
  await expect(secondButton).toHaveAttribute('aria-expanded', 'false')
  await secondButton.click()
  await expect(secondButton).toHaveAttribute('aria-expanded', 'true')
  await expect(firstButton).toHaveAttribute('aria-expanded', 'false')
  await expect(firstAnswer).toBeHidden()

  const buttonSizes = await items.locator('button').evaluateAll((buttons) =>
    buttons.map((button) => {
      const rect = button.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }),
  )
  for (const size of buttonSizes) {
    expect(size.width).toBeGreaterThanOrEqual(44)
    expect(size.height).toBeGreaterThanOrEqual(44)
  }
})

test('public touch affordances keep 44px hit areas on compact screens', async ({
  page,
}) => {
  const selectors = [
    '.public-header a[href]',
    '.public-header button',
    '.home-hero a[href]',
    '.home-faq button',
    '.solution-tabs [role="tab"]',
    '.section-action a[href]',
    '.public-footer a[href]',
    '.contact-cta button',
  ]

  for (const viewport of compactViewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const offenders = await page.evaluate((targetSelectors) => {
      const elements = Array.from(
        new Set(
          targetSelectors.flatMap((selector) =>
            Array.from(document.querySelectorAll<HTMLElement>(selector)),
          ),
        ),
      )

      return elements
        .filter((element) => {
          const style = window.getComputedStyle(element)
          return (
            !element.closest('.honeypot') &&
            element.getClientRects().length > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.pointerEvents !== 'none' &&
            element.getAttribute('aria-hidden') !== 'true'
          )
        })
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return {
            tag: element.tagName.toLowerCase(),
            className: element.className,
            text: element.textContent?.trim().slice(0, 40) ?? '',
            width: rect.width,
            height: rect.height,
          }
        })
        .filter(({ width, height }) => width < 44 || height < 44)
    }, selectors)

    expect(
      offenders,
      `${viewport.width}x${viewport.height} controls below the 44px target`,
    ).toEqual([])
  }
})

test('compact technology topology keeps its full surface on mobile', async ({
  page,
}) => {
  for (const viewport of compactViewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const clipped = await page
      .locator('.ecosystem-visual')
      .evaluateAll((items) =>
        items
          .filter((element) => element.scrollHeight > element.clientHeight + 1)
          .map((element) => ({
            className: element.className,
            clientHeight: element.clientHeight,
            scrollHeight: element.scrollHeight,
          })),
      )

    expect(
      clipped,
      `${viewport.width}x${viewport.height} technology topology content is clipped`,
    ).toEqual([])
  }
})

test('dashboard-like marketing surfaces use readable text and tabular numerals', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')

  const typography = await page.evaluate(() => {
    const surfaces = ['.solution-tabs__visual', '.stats-grid']
    const surfaceVariants = surfaces.map((selector) =>
      [...document.querySelectorAll<HTMLElement>(selector)].map(
        (element) => window.getComputedStyle(element).fontVariantNumeric,
      ),
    )
    const readableSelectors = [
      '.solution-tabs__category',
      '.solution-tabs__focus strong',
      '.solution-tabs__focus small',
      '.solution-tabs__rows strong',
      '.solution-tabs__rows small',
      '.stat-counter strong',
      '.stat-counter span',
      '.stat-counter small',
    ]
    const fontSizes = readableSelectors.flatMap((selector) =>
      [...document.querySelectorAll<HTMLElement>(selector)]
        .filter((element) => element.getClientRects().length > 0)
        .map((element) =>
          Number.parseFloat(window.getComputedStyle(element).fontSize),
        ),
    )

    return { surfaceVariants, fontSizes }
  })

  for (const variants of typography.surfaceVariants) {
    expect(variants.length).toBeGreaterThan(0)
    for (const variant of variants) expect(variant).toContain('tabular-nums')
  }
  expect(typography.fontSizes.length).toBeGreaterThan(0)
  expect(Math.min(...typography.fontSizes)).toBeGreaterThanOrEqual(12)
})

test('mega menus use compact density for single-group content', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')

  const knowledgeTrigger = page.getByRole('button', { name: 'Kiến thức' })
  await knowledgeTrigger.hover()
  const knowledgeMenu = page
    .locator('.mega-menu')
    .filter({ hasText: 'Kiến thức' })
  await expect(knowledgeMenu).toHaveClass(/mega-menu--compact/)
  await expect(knowledgeMenu.locator('.mega-menu__groups')).toHaveCSS(
    'grid-template-columns',
    /px$/u,
  )
  expect(
    await knowledgeMenu
      .locator('.mega-menu__groups')
      .evaluate((element) => element.getBoundingClientRect().width),
  ).toBeLessThan(600)
  await expect(
    knowledgeMenu.locator('.mega-menu__rail p').nth(1),
  ).not.toHaveText(/Giải pháp/u)

  const solutionsTrigger = page.getByRole('button', { name: 'Giải pháp' })
  await solutionsTrigger.hover()
  const solutionsMenu = page
    .locator('.mega-menu')
    .filter({ hasText: 'Giải pháp' })
  await expect(solutionsMenu).toHaveClass(/mega-menu--medium/)
  await expect(solutionsMenu.locator('.mega-menu__group')).toHaveCount(2)
})

test('consent error slot stays stable when validation reveals a two-line message', async ({
  page,
}) => {
  await page.setViewportSize({ width: 414, height: 896 })
  await page.goto('/')

  const form = page.locator('.contact-cta__form form')
  const before = await form.evaluate(
    (element) => element.getBoundingClientRect().height,
  )
  await form.getByRole('button', { name: /Gửi yêu cầu tư vấn/u }).click()
  const consentMessage = form.locator('[id$="-consent-error"]')
  await expect(consentMessage).toContainText('Bạn cần đồng ý')
  const after = await form.evaluate(
    (element) => element.getBoundingClientRect().height,
  )
  expect(Math.abs(after - before)).toBeLessThanOrEqual(1)

  const metrics = await consentMessage.evaluate((element) => {
    const style = window.getComputedStyle(element)
    return {
      height: element.getBoundingClientRect().height,
      lineHeight: parseFloat(style.lineHeight),
    }
  })
  expect(metrics.height).toBeGreaterThanOrEqual(metrics.lineHeight * 2 - 1)
})
