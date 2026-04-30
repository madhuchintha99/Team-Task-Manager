import { NextResponse } from 'next/server'

export type ValidationError = { field: string; message: string }

/**
 * Validates that required string fields are present and non-empty.
 */
export function validateRequired(
  data: Record<string, unknown>,
  fields: string[]
): ValidationError[] {
  return fields
    .filter((f) => !data[f] || String(data[f]).trim() === '')
    .map((f) => ({ field: f, message: `${f} is required` }))
}

/**
 * Validates that a value belongs to an allowed set.
 */
export function validateEnum(
  value: unknown,
  allowed: string[],
  fieldName: string
): ValidationError | null {
  if (value !== undefined && value !== null && !allowed.includes(String(value))) {
    return { field: fieldName, message: `${fieldName} must be one of: ${allowed.join(', ')}` }
  }
  return null
}

/**
 * Returns a 400 Bad Request response with validation errors.
 */
export function validationError(errors: ValidationError[]) {
  return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 })
}

export const TASK_STATUSES = ['todo', 'in-progress', 'done'] as const
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const
