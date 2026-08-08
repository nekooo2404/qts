import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

const accounts = {
  admin: { email: 'admin@qts.local', password: 'QtsAdmin123!' },
  staff: { email: 'staff@qts.local', password: 'QtsStaff123!' },
  customer: { email: 'customer@qts.local', password: 'QtsCustomer123!' },
}

async function login(page: Page, account: keyof typeof accounts) {
  await page.goto('/portal/login')
  await page.getByLabel('Email').fill(accounts[account].email)
  await page.getByLabel('Mật khẩu').fill(accounts[account].password)
  await Promise.all([
    page.waitForURL(/\/portal\/dashboard$/, { timeout: 15_000 }),
    page.getByRole('button', { name: 'Đăng nhập QTS Portal' }).click(),
  ])
}

test('1. đăng nhập thành công', async ({ page }) => {
  await login(page, 'admin')
  await expect(page.getByRole('heading', { name: 'Chào demo' })).toBeVisible()
  await expect(
    page.getByText('Dữ liệu vận hành trên toàn hệ thống'),
  ).toBeVisible()
})

test('2. báo lỗi khi mật khẩu sai', async ({ page }) => {
  await page.goto('/portal/login')
  await page.getByLabel('Email').fill(accounts.customer.email)
  await page.getByLabel('Mật khẩu').fill('MatKhauSai123!')
  await page.getByRole('button', { name: 'Đăng nhập QTS Portal' }).click()
  await expect(page.locator('.auth-form [role="alert"]')).toContainText(
    'Email hoặc mật khẩu không đúng',
  )
  await expect(page).toHaveURL(/\/portal\/login/)
})

test('3. customer tạo ticket', async ({ page }) => {
  await login(page, 'customer')
  await page.goto('/portal/tickets')
  await page.getByText('Tạo ticket hỗ trợ', { exact: true }).click()
  const ticketForm = page.locator('#create-ticket')
  await ticketForm.getByLabel('Tiêu đề').fill('Kiểm tra luồng tạo ticket E2E')
  await ticketForm.getByLabel('Loại yêu cầu').selectOption('TECHNICAL')
  await ticketForm
    .getByLabel('Mức ưu tiên', { exact: true })
    .selectOption('HIGH')
  await ticketForm
    .getByLabel('Dự án liên quan')
    .selectOption('project-demo-portal')
  await ticketForm
    .getByLabel('Nội dung')
    .fill(
      'Nội dung kiểm thử E2E đủ dài để xác nhận ticket được lưu và mở đúng trang chi tiết.',
    )
  await ticketForm
    .getByRole('button', { name: 'Tạo ticket', exact: true })
    .click()
  await expect(page).toHaveURL(/\/portal\/tickets\/[A-Za-z0-9_-]+$/)
  await expect(
    page.getByRole('heading', { name: 'Kiểm tra luồng tạo ticket E2E' }),
  ).toBeVisible()
})

test('4. staff cập nhật trạng thái ticket', async ({ page }) => {
  await login(page, 'staff')
  await page.goto('/portal/tickets/ticket-demo-1')
  await page.getByLabel('Trạng thái').selectOption('ACKNOWLEDGED')
  await page.getByRole('button', { name: 'Cập nhật ticket' }).click()
  await expect(
    page.getByText('Đã tiếp nhận', { exact: true }).first(),
  ).toBeVisible()
  await expect(page.getByText('Đã cập nhật ticket.')).toBeVisible()
})

test('5. admin tạo và xuất bản bài blog', async ({ page }) => {
  await login(page, 'admin')
  await page.goto('/portal/admin/content')
  await page.getByText('Tạo bài viết mới', { exact: true }).click()
  const editor = page.locator('#create-blog')
  await editor
    .getByLabel('Tiêu đề bài viết')
    .fill('Bài kiểm thử quy trình CMS QTS')
  await editor.getByLabel('Slug').fill('bai-kiem-thu-quy-trinh-cms-qts')
  await editor.getByLabel('Trạng thái').selectOption('PUBLISHED')
  await editor
    .getByLabel('Mô tả ngắn')
    .fill(
      'Nội dung mô tả ngắn dùng để kiểm thử luồng tạo bài viết trong CMS QTS Portal.',
    )
  await editor
    .getByLabel('Nội dung', { exact: true })
    .fill(
      'Đây là nội dung bài viết dùng cho kiểm thử E2E. Nội dung có đủ độ dài để vượt qua validation và xác nhận bản ghi được xuất bản thành công trên website công khai.',
    )
  await editor.getByLabel('SEO title').fill('Bài kiểm thử CMS QTS')
  await editor
    .getByLabel('SEO description')
    .fill('Mô tả SEO dành cho bài kiểm thử CMS QTS Portal.')
  await editor.getByRole('button', { name: 'Tạo bài viết' }).click()
  await expect(page.getByText('Đã tạo bài viết.')).toBeVisible()
  await expect(
    page.getByText('Bài kiểm thử quy trình CMS QTS', { exact: true }),
  ).toBeVisible()
})

test('6. customer bị chặn khỏi admin và dự án tổ chức khác', async ({
  page,
}) => {
  await login(page, 'customer')
  await page.goto('/portal/admin')
  await expect(page).toHaveURL(/\/403$/)
  await expect(
    page.getByRole('heading', { name: /không có quyền/i }),
  ).toBeVisible()

  await page.goto('/portal/dashboard')
  const status = await page.evaluate(async () => {
    const response = await fetch('/api/portal/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Yêu cầu không hợp lệ qua IDOR',
        category: 'TECHNICAL',
        priority: 'MEDIUM',
        description:
          'Nội dung hợp lệ về độ dài nhưng cố tình trỏ tới dự án của tổ chức khác.',
        projectId: 'project-internal-qts',
      }),
    })
    return response.status
  })
  expect(status).toBe(404)
})

test('7. form liên hệ gửi thành công', async ({ page }) => {
  await page.goto('/lien-he')
  await page.getByLabel('Họ và tên').fill('Người kiểm thử QTS')
  await page.getByLabel('Công ty / tổ chức').fill('Doanh nghiệp demo E2E')
  await page.getByLabel('Số điện thoại').fill('0900000001')
  await page.getByLabel('Email').fill('e2e-contact@example.com')
  await page
    .getByLabel('Nhu cầu trao đổi')
    .fill(
      'Tôi cần trao đổi về một hệ thống phần mềm doanh nghiệp và quy trình triển khai theo từng giai đoạn.',
    )
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Gửi yêu cầu liên hệ' }).click()
  await expect(page.getByRole('status')).toContainText('QTS đã nhận thông tin')
})

test('8. mega menu desktop tự mở khi hover và hỗ trợ Escape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const trigger = page.getByRole('button', {
    name: 'Hệ sinh thái',
    exact: true,
  })
  const solutionTrigger = page.getByRole('button', {
    name: 'Giải pháp',
    exact: true,
  })

  await trigger.hover()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByLabel('Menu Hệ sinh thái')).toBeVisible()

  await solutionTrigger.hover()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(solutionTrigger).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByLabel('Menu Giải pháp')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(solutionTrigger).toHaveAttribute('aria-expanded', 'false')
  await expect(solutionTrigger).toBeFocused()

  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
})

test('9. mobile menu dạng accordion điều hướng được', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Mở menu điều hướng' }).click()
  const dialog = page.getByRole('dialog', { name: 'Điều hướng QTS' })
  await expect(dialog).toBeVisible()
  const products = dialog.getByRole('button', { name: 'Hệ sinh thái' })
  await products.click()
  await expect(products).toHaveAttribute('aria-expanded', 'true')
  await expect(
    dialog.getByRole('link', { name: 'QTS Portal', exact: true }),
  ).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Đóng menu' }).click()
  await page.goto('/portal/login')
  await expect(page).toHaveURL(/\/portal\/login$/)
})

test('10. đăng xuất thu hồi phiên hiện tại', async ({ page }) => {
  await login(page, 'customer')
  await page.getByRole('button', { name: /Khách hàng demo/ }).click()
  await page.getByRole('menuitem', { name: 'Đăng xuất' }).click()
  await expect(page).toHaveURL(/\/portal\/login$/)
  await page.goto('/portal/dashboard')
  await expect(page).toHaveURL(/\/portal\/login\?next=/)
})

test('11. admin tạo mức ngân sách và biểu mẫu công khai cập nhật', async ({
  page,
}) => {
  await login(page, 'admin')
  await page.goto('/admin/content#budget-options')

  const label = `Ngân sách E2E ${Date.now()}`
  const section = page.locator('#budget-options')
  await section.locator('#new-budget-option-label').fill(label)
  await section.locator('#new-budget-option-order').fill('990')

  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/portal/admin/budget-options') &&
      response.request().method() === 'POST',
  )
  await section.locator('.budget-option-create button[type="submit"]').click()
  const createResponse = await createResponsePromise
  expect(createResponse.status()).toBe(201)

  const payload = (await createResponse.json()) as {
    data?: { id: string }
  }
  expect(payload.data?.id).toBeTruthy()
  await expect(section.locator('input[name="label"]').last()).toHaveValue(label)

  const duplicateStatus = await page.evaluate(async (duplicateLabel) => {
    const response = await fetch('/api/portal/admin/budget-options', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        label: duplicateLabel.toUpperCase(),
        sortOrder: 991,
        active: true,
      }),
    })
    return response.status
  }, label)
  expect(duplicateStatus).toBe(409)

  await page.goto('/bao-gia')
  await expect(page.getByRole('radio', { name: label })).toBeVisible()

  await page.goto('/admin/content#budget-options')
  const deactivateStatus = await page.evaluate(async (id) => {
    const response = await fetch(`/api/portal/admin/budget-options/${id}`, {
      method: 'DELETE',
    })
    return response.status
  }, payload.data!.id)
  expect(deactivateStatus).toBe(200)

  const afterDelete = await page.evaluate(async () => {
    const response = await fetch('/api/portal/admin/budget-options')
    return (await response.json()) as {
      data?: Array<{ id: string; sortOrder: number; active: boolean }>
    }
  })
  const deleted = afterDelete.data?.find(
    (option) => option.id === payload.data!.id,
  )
  expect(deleted).toMatchObject({ sortOrder: 990, active: false })

  await page.reload()
  await expect(section.locator('#new-budget-option-order')).toHaveValue('1000')
})
