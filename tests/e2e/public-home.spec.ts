import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const viewports = [
  { width: 320, height: 800 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 1000 },
  { width: 1920, height: 1080 },
]

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
