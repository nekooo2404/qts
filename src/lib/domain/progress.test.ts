import { describe, expect, it } from 'vitest'

import { calculateProjectProgress } from '@/lib/domain/progress'

describe('calculateProjectProgress', () => {
  it('returns zero when a project has no tasks', () => {
    expect(calculateProjectProgress([])).toBe(0)
  })

  it('uses explicit task progress and rounds to the nearest integer', () => {
    expect(
      calculateProjectProgress([
        { status: 'DONE', progress: 100 },
        { status: 'IN_PROGRESS', progress: 45 },
        { status: 'TODO', progress: 0 },
      ]),
    ).toBe(48)
  })

  it('clamps malformed progress values to the 0-100 range', () => {
    expect(
      calculateProjectProgress([
        { status: 'DONE', progress: 130 },
        { status: 'TODO', progress: -20 },
      ]),
    ).toBe(50)
  })
})
