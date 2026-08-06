import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

const accounts = {
  admin: { email: 'admin@qts.local', password: 'QtsAdmin123!' },
  staff: { email: 'staff@qts.local', password: 'QtsStaff123!' },
  customer: { email: 'customer@qts.local', password: 'QtsCustomer123!' },
}

async function login(
  page: Page,
  account: keyof typeof accounts,
  next = '/portal/dashboard',
) {
  await page.goto(`/portal/login?next=${encodeURIComponent(next)}`)
  await page.locator('#login-email').fill(accounts[account].email)
  await page.locator('#login-password').fill(accounts[account].password)
  await Promise.all([
    page.waitForURL(
      next === '/admin' ? /\/admin\/?$/ : /\/portal\/dashboard\/?$/,
    ),
    page.locator('form.auth-form button[type="submit"]').click(),
  ])
}

test('public root keeps the authenticated surfaces out of its experience', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('.portal-preview')).toHaveCount(0)
  await expect(page.locator('body')).not.toContainText('QTS Portal')
  await expect(page.locator('body')).not.toContainText('Đăng nhập Portal')
})

test('admin has its own protected route and navigation surface', async ({
  page,
}) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/portal\/login\?next=%2Fadmin/)

  await login(page, 'admin', '/admin')
  await expect(page).toHaveURL(/\/admin\/?$/)
  await expect(
    page.getByRole('heading', { name: 'Quản trị hệ thống' }),
  ).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Điều hướng quản trị' }),
  ).toBeVisible()
  await expect(
    page
      .getByRole('navigation', { name: 'Điều hướng quản trị' })
      .getByRole('link', {
        name: 'Người dùng',
        exact: true,
      }),
  ).toHaveAttribute('href', '/admin/users')
})

test('legacy portal admin URLs resolve to the separate admin surface', async ({
  page,
}) => {
  await login(page, 'admin')
  await page.goto('/portal/admin/users')
  await expect(page).toHaveURL(/\/admin\/users\/?$/)
})

test('an explicit per-user DENY blocks a portal route at the server boundary', async ({
  page,
}) => {
  await login(page, 'admin', '/admin')

  const denied = await page.evaluate(async () => {
    const response = await fetch('/api/admin/users/user-customer/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        overrides: [{ key: 'portal.projects.read', effect: 'DENY' }],
      }),
    })
    return response.ok
  })
  expect(denied).toBe(true)

  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }))
  await login(page, 'customer')
  await page.goto('/portal/projects')
  await expect(page).toHaveURL(/\/403\/?$/)

  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }))
  await login(page, 'admin', '/admin')
  const restored = await page.evaluate(async () => {
    const response = await fetch('/api/admin/users/user-customer/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: [] }),
    })
    return response.ok
  })
  expect(restored).toBe(true)
})

test('a base read DENY also blocks dependent staff mutations', async ({
  page,
}) => {
  await login(page, 'admin', '/admin')

  const denied = await page.evaluate(async () => {
    const response = await fetch('/api/admin/users/user-staff/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        overrides: [{ key: 'portal.projects.read', effect: 'DENY' }],
      }),
    })
    return response.ok
  })
  expect(denied).toBe(true)

  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }))
  await login(page, 'staff')
  const mutationStatus = await page.evaluate(async () => {
    const response = await fetch('/api/portal/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'DENY-CASCADE-CHECK',
        name: 'Denied cascade project',
        description:
          'A valid payload that must be rejected by permission cascade.',
        organizationId: 'org-demo-customer',
        status: 'PLANNING',
        priority: 'MEDIUM',
        progress: 0,
        startDate: '',
        dueDate: '',
      }),
    })
    return response.status
  })
  expect(mutationStatus).toBe(403)

  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }))
  await login(page, 'admin', '/admin')
  const restored = await page.evaluate(async () => {
    const response = await fetch('/api/admin/users/user-staff/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: [] }),
    })
    return response.ok
  })
  expect(restored).toBe(true)
})

test('an explicit ALLOW opens only the admin modules granted to that user', async ({
  page,
}) => {
  await login(page, 'admin', '/admin')

  const granted = await page.evaluate(async () => {
    const response = await fetch('/api/admin/users/user-staff/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        overrides: [
          { key: 'admin.access', effect: 'ALLOW' },
          { key: 'admin.dashboard.read', effect: 'ALLOW' },
          { key: 'admin.users.update', effect: 'ALLOW' },
        ],
      }),
    })
    return response.ok
  })
  expect(granted).toBe(true)

  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }))
  await login(page, 'staff')
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/?$/)
  await expect(
    page.getByRole('heading', { name: 'Quản trị hệ thống' }),
  ).toBeVisible()

  await page.goto('/admin/users')
  await expect(page).toHaveURL(/\/admin\/users\/?$/)
  await expect(page.getByRole('heading', { name: 'Người dùng' })).toBeVisible()

  const roleMutationStatus = await page.evaluate(async () => {
    const response = await fetch('/api/portal/admin/users/user-customer', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMIN', active: true }),
    })
    return response.status
  })
  expect(roleMutationStatus).toBe(403)

  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }))
  await login(page, 'admin', '/admin')
  const restored = await page.evaluate(async () => {
    const response = await fetch('/api/admin/users/user-staff/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: [] }),
    })
    return response.ok
  })
  expect(restored).toBe(true)
})

test('a scoped staff mutation cannot move an assigned project across organizations', async ({
  page,
}) => {
  await login(page, 'admin', '/admin')
  const granted = await page.evaluate(async () => {
    const response = await fetch('/api/admin/users/user-staff/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        overrides: [
          { key: 'portal.projects.read.all', effect: 'ALLOW' },
          { key: 'portal.documents.read.all', effect: 'DENY' },
          { key: 'portal.tickets.read.all', effect: 'DENY' },
        ],
      }),
    })
    return response.ok
  })
  expect(granted).toBe(true)

  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }))
  await login(page, 'staff')
  const status = await page.evaluate(async () => {
    const response = await fetch('/api/portal/projects/project-demo-portal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'QTS-2026-001',
        name: 'Demo project scope check',
        description: 'A valid payload used to verify organization boundaries.',
        organizationId: 'org-qts',
        status: 'ACTIVE',
        priority: 'HIGH',
        progress: 58,
        startDate: '',
        dueDate: '',
      }),
    })
    return response.status
  })
  expect(status).toBe(403)

  await page.goto('/portal/projects/project-demo-portal')
  await expect(
    page.getByRole('heading', { name: 'Cổng vận hành doanh nghiệp demo' }),
  ).toBeVisible()
  await expect(page.locator('#documents .resource-list > *')).toHaveCount(0)
  await expect(page.locator('#activity')).not.toContainText('TK-2026-001')

  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }))
  await login(page, 'admin', '/admin')
  const restored = await page.evaluate(async () => {
    const response = await fetch('/api/admin/users/user-staff/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: [] }),
    })
    return response.ok
  })
  expect(restored).toBe(true)
})

test('customers cannot compose notifications through the API', async ({
  page,
}) => {
  await login(page, 'customer')
  const status = await page.evaluate(async () => {
    const response = await fetch('/api/portal/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-staff',
        title: 'Unauthorized notification',
        message: 'This request must be rejected before any record is created.',
        type: 'INFO',
      }),
    })
    return response.status
  })
  expect(status).toBe(403)
})

test('the last active permission manager cannot remove their own capability', async ({
  page,
}) => {
  await login(page, 'admin', '/admin')
  const status = await page.evaluate(async () => {
    const response = await fetch('/api/admin/users/user-admin/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        overrides: [{ key: 'admin.permissions.manage', effect: 'DENY' }],
      }),
    })
    return response.status
  })
  expect(status).toBe(409)
})

test('an account cannot change its own base role', async ({ page }) => {
  await login(page, 'admin', '/admin')
  const status = await page.evaluate(async () => {
    const response = await fetch('/api/portal/admin/users/user-admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'STAFF', active: true }),
    })
    return response.status
  })
  expect(status).toBe(409)
})
