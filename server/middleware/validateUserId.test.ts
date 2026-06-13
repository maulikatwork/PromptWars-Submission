import { describe, expect, it } from 'vitest'
import { isValidUuidV4 } from '../middleware/validateUserId'

describe('isValidUuidV4', () => {
  it('returns true for a valid UUID v4', () => {
    expect(isValidUuidV4('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('returns false when version nibble is not 4', () => {
    expect(isValidUuidV4('550e8400-e29b-31d4-a716-446655440000')).toBe(false)
  })

  it('returns false for empty input', () => {
    expect(isValidUuidV4('')).toBe(false)
  })
})
