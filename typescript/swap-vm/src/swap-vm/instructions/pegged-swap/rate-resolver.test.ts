// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { resolveRate } from './rate-resolver'

describe('resolveRate', () => {
  it('should return 1 when decimals are equal', () => {
    expect(resolveRate(18, 18)).toBe(1n)
    expect(resolveRate(6, 6)).toBe(1n)
    expect(resolveRate(0, 0)).toBe(1n)
  })

  it('should return 1 when tokenA has more decimals than tokenB', () => {
    expect(resolveRate(18, 6)).toBe(1n)
    expect(resolveRate(18, 0)).toBe(1n)
    expect(resolveRate(12, 6)).toBe(1n)
  })

  it('should return 10^(B-A) when tokenA has fewer decimals than tokenB', () => {
    expect(resolveRate(6, 18)).toBe(10n ** 12n)
    expect(resolveRate(0, 18)).toBe(10n ** 18n)
    expect(resolveRate(6, 12)).toBe(10n ** 6n)
  })
})
