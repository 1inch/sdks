import { parseUnits } from 'viem'
import assert from 'assert'

/**
 * Parses a decimal with viem `parseUnits` and rejects a fraction longer than `scale`.
 */
export function parseScaled(value: number | string, scale: number, name: string): bigint {
  if (typeof value === 'number') {
    assert(Number.isFinite(value), `Invalid ${name}: ${value}. Must be a finite number`)
  }

  const decimal = typeof value === 'number' ? exactDecimal(value) : value
  const dot = decimal.indexOf('.')
  const places = dot === -1 ? 0 : decimal.length - dot - 1

  assert(places <= scale, `Invalid ${name}: ${value}. Must have at most ${scale} decimal places`)

  return parseUnits(decimal, scale)
}

function exactDecimal(value: number): string {
  const text = value.toString().toLowerCase()
  const expIndex = text.indexOf('e')

  if (expIndex === -1) {
    return text
  }

  const exponent = Number(text.slice(expIndex + 1))
  const negative = text.startsWith('-')
  const mantissa = text.slice(negative ? 1 : 0, expIndex)
  const [whole, fraction = ''] = mantissa.split('.')
  const digits = `${whole}${fraction}`
  const point = whole.length + exponent
  const sign = negative ? '-' : ''

  if (point <= 0) {
    return `${sign}0.${'0'.repeat(-point)}${digits}`
  }

  if (point >= digits.length) {
    return `${sign}${digits}${'0'.repeat(point - digits.length)}`
  }

  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`
}
