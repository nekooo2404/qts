import { describe, expect, it } from 'vitest'

import {
  contactSchema,
  loginSchema,
  quoteSchema,
  ticketSchema,
} from '@/lib/validation/forms'

describe('public and portal validation', () => {
  it('accepts a valid contact request and strips surrounding whitespace', () => {
    const result = contactSchema.parse({
      name: '  Nguyễn An  ',
      email: 'an@example.com',
      phone: '0901234567',
      company: 'Công ty mẫu',
      message: 'Tôi cần tư vấn một hệ thống quản trị nội bộ.',
      website: '',
      consent: true,
    })

    expect(result.name).toBe('Nguyễn An')
  })

  it('rejects the honeypot field when a bot fills it', () => {
    expect(
      contactSchema.safeParse({
        name: 'Nguyễn An',
        email: 'an@example.com',
        phone: '0901234567',
        company: '',
        message: 'Tôi cần tư vấn một hệ thống quản trị nội bộ.',
        website: 'https://spam.example',
        consent: true,
      }).success,
    ).toBe(false)
  })

  it('validates quote details and ticket descriptions', () => {
    expect(
      quoteSchema.safeParse({
        name: 'Nguyễn An',
        email: 'an@example.com',
        phone: '0901234567',
        company: 'Công ty mẫu',
        service: 'Phát triển phần mềm',
        budget: '200-500 triệu',
        timeline: '3-6 tháng',
        needs: 'Xây dựng cổng vận hành có phân quyền cho nhiều phòng ban.',
        website: '',
        consent: true,
      }).success,
    ).toBe(true)

    expect(
      ticketSchema.safeParse({
        subject: 'Lỗi đồng bộ dữ liệu',
        category: 'TECHNICAL',
        priority: 'HIGH',
        description: 'Dữ liệu đơn hàng chưa đồng bộ sau lần chạy gần nhất.',
      }).success,
    ).toBe(true)
  })

  it('does not accept weak or malformed login input', () => {
    const result = loginSchema.safeParse({
      email: 'không-phải-email',
      password: '123',
    })

    expect(result.success).toBe(false)
  })
})
