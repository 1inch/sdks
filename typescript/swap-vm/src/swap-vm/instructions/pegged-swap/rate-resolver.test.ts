// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { resolveRate } from './rate-resolver'

describe('resolveRate', () => {
  it('should return 1 when decimals are equal', () => {
    expect(resolveRate(18n, 18n)).toBe(1n)
    expect(resolveRate(6n, 6n)).toBe(1n)
    expect(resolveRate(0n, 0n)).toBe(1n)
  })

  it('should return 1 when tokenA has more decimals than tokenB', () => {
    expect(resolveRate(18n, 6n)).toBe(1n)
    expect(resolveRate(18n, 0n)).toBe(1n)
    expect(resolveRate(12n, 6n)).toBe(1n)
  })

  it('should return 10^(B-A) when tokenA has fewer decimals than tokenB', () => {
    expect(resolveRate(6n, 18n)).toBe(10n ** 12n)
    expect(resolveRate(0n, 18n)).toBe(10n ** 18n)
    expect(resolveRate(6n, 12n)).toBe(10n ** 6n)
  })
})
