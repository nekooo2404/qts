import { describe, expect, it } from 'vitest'

import {
  allowedTicketTransitions,
  canTransitionTicket,
} from '@/lib/domain/ticket-workflow'

describe('ticket workflow', () => {
  it('allows staff to move an open ticket through the support lifecycle', () => {
    expect(canTransitionTicket('STAFF', 'NEW', 'ACKNOWLEDGED')).toBe(true)
    expect(canTransitionTicket('STAFF', 'ACKNOWLEDGED', 'IN_PROGRESS')).toBe(
      true,
    )
    expect(canTransitionTicket('STAFF', 'IN_PROGRESS', 'RESOLVED')).toBe(true)
    expect(canTransitionTicket('STAFF', 'RESOLVED', 'CLOSED')).toBe(true)
  })

  it('lets a customer reopen a resolved ticket but not self-resolve it', () => {
    expect(canTransitionTicket('CUSTOMER', 'RESOLVED', 'NEW')).toBe(true)
    expect(canTransitionTicket('CUSTOMER', 'NEW', 'RESOLVED')).toBe(false)
  })

  it('rejects skipped and no-op transitions', () => {
    expect(canTransitionTicket('ADMIN', 'NEW', 'CLOSED')).toBe(false)
    expect(canTransitionTicket('STAFF', 'NEW', 'NEW')).toBe(false)
  })

  it('returns only transitions the role can perform', () => {
    expect(allowedTicketTransitions('CUSTOMER', 'RESOLVED')).toEqual(['NEW'])
    expect(allowedTicketTransitions('STAFF', 'NEW')).toEqual(['ACKNOWLEDGED'])
  })
})
