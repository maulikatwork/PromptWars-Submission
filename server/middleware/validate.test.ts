import { describe, expect, it } from 'vitest'
import { isValidExam } from '../constants/exams'
import {
  mapMongooseValidationError,
  parsePagination,
  validateOptionalFutureDate,
  validateRequiredTrimmedString,
} from '../middleware/validate'

describe('validateRequiredTrimmedString', () => {
  it('returns trimmed value for valid input', () => {
    const result = validateRequiredTrimmedString('  hello  ', 'Name', 60)
    expect(result).toEqual({ ok: true, value: 'hello' })
  })

  it('rejects empty strings after trim', () => {
    const result = validateRequiredTrimmedString('   ', 'Journal text', 4000)
    expect(result).toEqual({
      ok: false,
      response: { error: 'Journal text cannot be empty', field: 'Journal text' },
    })
  })

  it('rejects strings exceeding max length', () => {
    const result = validateRequiredTrimmedString('a'.repeat(61), 'Name', 60)
    expect(result).toEqual({
      ok: false,
      response: { error: 'Name must be 60 characters or fewer', field: 'Name' },
    })
  })

  it('rejects non-string input', () => {
    const result = validateRequiredTrimmedString(undefined, 'Name', 60)
    expect(result).toEqual({ ok: false, response: { error: 'Name is required', field: 'Name' } })
  })
})

describe('validateOptionalFutureDate', () => {
  it('accepts missing target date', () => {
    expect(validateOptionalFutureDate(undefined)).toEqual({ ok: true, value: null })
    expect(validateOptionalFutureDate('')).toEqual({ ok: true, value: null })
  })

  it('accepts today as a valid target date', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isoDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-')
    const result = validateOptionalFutureDate(isoDate)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value?.getFullYear()).toBe(today.getFullYear())
    }
  })

  it('rejects past dates', () => {
    const result = validateOptionalFutureDate('2020-01-01')
    expect(result).toEqual({
      ok: false,
      response: { error: 'Target date must be a valid future date', field: 'targetDate' },
    })
  })

  it('rejects invalid date strings', () => {
    const result = validateOptionalFutureDate('not-a-date')
    expect(result).toEqual({
      ok: false,
      response: { error: 'Target date must be a valid future date', field: 'targetDate' },
    })
  })
})

describe('parsePagination', () => {
  it('uses defaults when query params are missing', () => {
    expect(parsePagination(undefined, undefined)).toEqual({ limit: 20, offset: 0 })
  })

  it('caps limit at 100 and floors offset at 0', () => {
    expect(parsePagination('500', '-5')).toEqual({ limit: 100, offset: 0 })
  })

  it('falls back to defaults for invalid numbers', () => {
    expect(parsePagination('abc', 'xyz')).toEqual({ limit: 20, offset: 0 })
  })
})

describe('isValidExam', () => {
  it('accepts supported exam values', () => {
    expect(isValidExam('JEE')).toBe(true)
    expect(isValidExam('Other')).toBe(true)
  })

  it('rejects unsupported exam values', () => {
    expect(isValidExam('SAT')).toBe(false)
    expect(isValidExam(null)).toBe(false)
  })
})

describe('mapMongooseValidationError', () => {
  it('maps the first mongoose validation error to a readable response', () => {
    const response = mapMongooseValidationError({
      errors: {
        rawText: { message: 'Journal text cannot be empty', path: 'rawText' },
      },
    })

    expect(response).toEqual({
      error: 'Journal text cannot be empty',
      field: 'rawText',
    })
  })
})
