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

test('homepage stays in-bounds and reveals its product surface', async ({
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

      const visual = document
        .querySelector('.home-hero__visual')
        ?.getBoundingClientRect()

      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        visualTop: visual?.top ?? Number.POSITIVE_INFINITY,
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
      geometry.visualTop,
      `${viewport.width}x${viewport.height} product surface`,
    ).toBeLessThan(geometry.viewportHeight)
  }
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

test('hero keeps a meaningful technology topology inside the 1280x800 fold', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')

  const preview = page.locator('.ecosystem-visual__topology')
  await expect(preview).toBeVisible()

  const geometry = await preview.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const core = element.querySelector('.ecosystem-visual__core')
    const nodes = element.querySelectorAll('.ecosystem-visual__node')
    const visibleHeight = Math.max(
      0,
      Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0),
    )

    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      visibleRatio: rect.height ? visibleHeight / rect.height : 0,
      coreHeight: core?.getBoundingClientRect().height ?? 0,
      nodeCount: nodes.length,
    }
  })

  expect(
    geometry.top,
    'hero topology starts too low in the first fold',
  ).toBeLessThanOrEqual(540)
  expect(
    geometry.bottom,
    'hero topology is clipped below the 1280x800 fold',
  ).toBeLessThanOrEqual(801)
  expect(
    geometry.height,
    'hero topology has no inspectable surface',
  ).toBeGreaterThan(150)
  expect(
    geometry.scrollHeight,
    'hero topology content overflows its frame',
  ).toBeLessThanOrEqual(geometry.clientHeight)
  expect(
    geometry.visibleRatio,
    'hero topology is mostly clipped',
  ).toBeGreaterThanOrEqual(0.9)
  expect(geometry.coreHeight, 'technology core is not visible').toBeGreaterThan(
    0,
  )
  expect(geometry.nodeCount, 'technology nodes are not visible').toBe(4)
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
    const surfaces = [
      '.ecosystem-visual__core',
      '.solution-tabs__visual',
      '.stats-grid',
    ]
    const surfaceVariants = surfaces.map((selector) =>
      [...document.querySelectorAll<HTMLElement>(selector)].map(
        (element) => window.getComputedStyle(element).fontVariantNumeric,
      ),
    )
    const readableSelectors = [
      '.ecosystem-visual__core-label',
      '.ecosystem-visual__core-intro strong',
      '.ecosystem-visual__core-intro small',
      '.ecosystem-visual__core-note strong',
      '.ecosystem-visual__core-note span',
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
