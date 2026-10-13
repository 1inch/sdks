import { parseUnits } from 'viem'
import assert from 'assert'

/**
 * Parses a decimal with viem `parseUnits`.
 * Rejects exponent notation and a fraction longer than `scale`.
 */
export function parseScaled(value: number | string, scale: number, name: string): bigint {
  if (typeof value === 'number') {
    assert(Number.isFinite(value), `Invalid ${name}: ${value}. Must be a finite number`)
  }

  const decimal = typeof value === 'number' ? value.toString() : value

  assert(!/[eE]/.test(decimal), `Invalid ${name}: ${value}. Exponent notation is not allowed`)

  const dot = decimal.indexOf('.')
  const places = dot === -1 ? 0 : decimal.length - dot - 1

  assert(places <= scale, `Invalid ${name}: ${value}. Must have at most ${scale} decimal places`)

  return parseUnits(decimal, scale)
}
