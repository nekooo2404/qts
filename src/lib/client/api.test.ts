import { afterEach, describe, expect, it, vi } from 'vitest'

import { apiMutation } from '@/lib/client/api'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiMutation', () => {
  it('returns a valid successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          ok: true,
          message: 'Đã lưu.',
          data: { id: 'item-1' },
        }),
      ),
    )

    await expect(
      apiMutation<{ id: string }>('/api/items', 'POST', { name: 'QTS' }),
    ).resolves.toEqual({
      ok: true,
      message: 'Đã lưu.',
      data: { id: 'item-1' },
    })
  })

  it('never treats a failed HTTP status as success', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { ok: true, message: 'Không có quyền.' },
            { status: 403 },
          ),
        ),
    )

    await expect(apiMutation('/api/items/item-1', 'DELETE')).resolves.toEqual({
      ok: false,
      message: 'Không có quyền.',
    })
  })

  it('normalizes malformed and unreachable responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('not-json'))
      .mockRejectedValueOnce(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiMutation('/api/items', 'POST')).resolves.toEqual({
      ok: false,
      message: 'Phản hồi từ máy chủ không hợp lệ.',
    })
    await expect(apiMutation('/api/items', 'POST')).resolves.toEqual({
      ok: false,
      message: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
    })
  })
})
