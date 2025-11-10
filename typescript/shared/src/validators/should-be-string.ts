import assert from 'node:assert'

export function assertString(value: unknown, name = 'value'): asserts value is string {
  assert(
    value !== undefined && value !== null && typeof value === 'string',
    `${name} should be a valid string, but ${name}: ${value}`,
  )
}
