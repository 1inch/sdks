// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { UINT_256_MAX } from '@1inch/byte-utils'
import { describe, expect, it } from 'vitest'
import { mulDiv } from './mul-div'

describe('mulDiv', () => {
  it('rounds down', () => {
    expect(mulDiv(7n, 3n, 2n)).toBe(10n)
    expect(mulDiv(1n, 1n, 3n)).toBe(0n)
    expect(mulDiv(0n, UINT_256_MAX, 1n)).toBe(0n)
  })

  it('keeps full precision when only the intermediate product exceeds uint256', () => {
    expect(mulDiv(UINT_256_MAX, UINT_256_MAX, UINT_256_MAX)).toBe(UINT_256_MAX)
    expect(mulDiv(2n ** 255n, 2n ** 255n, 2n ** 256n - 1n)).toBe(2n ** 254n)
  })

  it('accepts results exactly equal to UINT_256_MAX', () => {
    expect(mulDiv(UINT_256_MAX, 1n, 1n)).toBe(UINT_256_MAX)
    expect(mulDiv(UINT_256_MAX, 2n, 2n)).toBe(UINT_256_MAX)
    expect(mulDiv(UINT_256_MAX, 3n, 3n)).toBe(UINT_256_MAX)
  })

  it('throws when the result exceeds UINT_256_MAX', () => {
    expect(() => mulDiv(2n ** 255n, 2n ** 255n, 1n)).toThrow('exceeds UINT_256_MAX')
    expect(() => mulDiv(2n ** 255n, 2n, 1n)).toThrow('exceeds UINT_256_MAX')
    expect(() => mulDiv(UINT_256_MAX, 3n, 2n)).toThrow('exceeds UINT_256_MAX')
  })

  it('throws on division by zero', () => {
    expect(() => mulDiv(1n, 1n, 0n)).toThrow('mulDiv: division by zero')
    expect(() => mulDiv(0n, 0n, 0n)).toThrow('mulDiv: division by zero')
  })

  it('throws on operands outside uint256', () => {
    expect(() => mulDiv(-1n, 1n, 1n)).toThrow('operands must be uint256 values')
    expect(() => mulDiv(1n, -1n, 1n)).toThrow('operands must be uint256 values')
    expect(() => mulDiv(1n, 1n, -1n)).toThrow('operands must be uint256 values')
    expect(() => mulDiv(UINT_256_MAX + 1n, 1n, 2n)).toThrow('operands must be uint256 values')
    expect(() => mulDiv(1n, UINT_256_MAX + 1n, 2n)).toThrow('operands must be uint256 values')
    expect(() => mulDiv(1n, 1n, UINT_256_MAX + 1n)).toThrow('operands must be uint256 values')
  })
})
