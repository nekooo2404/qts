import { describe, expect, it } from 'vitest'

import { formatCurrency, formatDateInput, formatFileSize } from '@/lib/utils'

describe('portal formatting utilities', () => {
  it('keeps zero financial values explicitly marked as demo data', () => {
    expect(formatCurrency(0)).toBe('[Giá trị demo]')
  })

  it('formats file sizes at stable units', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB')
  })

  it('formats a local date for native date inputs', () => {
    expect(formatDateInput(new Date(2026, 7, 5, 9, 30))).toBe('2026-08-05')
    expect(formatDateInput(null)).toBe('')
  })
})
