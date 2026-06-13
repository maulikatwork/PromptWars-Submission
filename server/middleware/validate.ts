export interface ValidationErrorResponse {
  error: string
  field?: string
}

export function validateRequiredTrimmedString(
  value: unknown,
  field: string,
  maxLength: number,
): { ok: true; value: string } | { ok: false; response: ValidationErrorResponse } {
  if (typeof value !== 'string') {
    return { ok: false, response: { error: `${field} is required`, field } }
  }

  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return { ok: false, response: { error: `${field} cannot be empty`, field } }
  }

  if (trimmed.length > maxLength) {
    return {
      ok: false,
      response: { error: `${field} must be ${maxLength} characters or fewer`, field },
    }
  }

  return { ok: true, value: trimmed }
}

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const parsedDate = new Date(year, month, day)

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month ||
    parsedDate.getDate() !== day
  ) {
    return null
  }

  return parsedDate
}

export function validateOptionalFutureDate(
  value: unknown,
): { ok: true; value: Date | null } | { ok: false; response: ValidationErrorResponse } {
  if (value === undefined || value === null || value === '') {
    return { ok: true, value: null }
  }

  if (typeof value !== 'string') {
    return { ok: false, response: { error: 'Target date must be a valid future date', field: 'targetDate' } }
  }

  const parsedDate = parseLocalDate(value)

  if (!parsedDate) {
    return { ok: false, response: { error: 'Target date must be a valid future date', field: 'targetDate' } }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (parsedDate < today) {
    return { ok: false, response: { error: 'Target date must be a valid future date', field: 'targetDate' } }
  }

  return { ok: true, value: parsedDate }
}

export function parsePagination(
  limitParam: unknown,
  offsetParam: unknown,
): { limit: number; offset: number } {
  const parsedLimit = Number.parseInt(String(limitParam ?? '20'), 10)
  const parsedOffset = Number.parseInt(String(offsetParam ?? '0'), 10)

  const limit = Number.isNaN(parsedLimit) ? 20 : Math.min(Math.max(parsedLimit, 1), 100)
  const offset = Number.isNaN(parsedOffset) ? 0 : Math.max(parsedOffset, 0)

  return { limit, offset }
}

export function mapMongooseValidationError(error: {
  errors: Record<string, { message: string; path?: string }>
}): ValidationErrorResponse {
  const firstKey = Object.keys(error.errors)[0]
  const firstError = error.errors[firstKey]

  return {
    error: firstError?.message ?? 'Validation failed',
    field: firstError?.path ?? firstKey,
  }
}
