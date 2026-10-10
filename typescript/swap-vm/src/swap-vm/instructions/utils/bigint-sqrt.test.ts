// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { UINT_256_MAX } from '@1inch/byte-utils'
import { describe, expect, it } from 'vitest'
import { bigintSqrt } from './bigint-sqrt'

const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER)

/** Largest n with n * n <= Number.MAX_SAFE_INTEGER, the last root served by the Math.sqrt path */
const MAX_SAFE_ROOT = 94906265n

function range(from: bigint, to: bigint, step = 1n): bigint[] {
  const values: bigint[] = []

  for (let value = from; value <= to; value += step) {
    values.push(value)
  }

  return values
}

function aroundSquares(roots: bigint[]): bigint[] {
  return roots.flatMap((n) => [n * n - 1n, n * n, n * n + 1n])
}

/** Values for which bigintSqrt breaks r * r <= value < (r + 1) * (r + 1) */
function floorSqrtViolations(values: bigint[]): string[] {
  return values
    .map((value) => ({ value, root: bigintSqrt(value) }))
    .filter(({ value, root }) => root * root > value || (root + 1n) * (root + 1n) <= value)
    .map(({ value, root }) => `bigintSqrt(${value}) = ${root}`)
}

/** Seeded `bits`-bit values from a 64-bit LCG, so a failing input can be reproduced */
function createRandomBits(seed: bigint): (bits: bigint) => bigint {
  let state = seed

  return (bits) => {
    let value = 0n

    for (let filled = 0n; filled < bits; filled += 32n) {
      state = (state * 6364136223846793005n + 1442695040888963407n) % 2n ** 64n
      value = (value << 32n) | (state >> 32n)
    }

    return value % 2n ** bits
  }
}

describe('bigintSqrt', () => {
  it('returns r for every value in [r^2, (r + 1)^2) up to 10^4', () => {
    for (let root = 0n; root < 100n; root++) {
      for (const value of range(root * root, (root + 1n) * (root + 1n) - 1n)) {
        expect(bigintSqrt(value)).toBe(root)
      }
    }
  })

  it('rounds down just below (2^26 + 1)^2, where Math.sqrt rounds up', () => {
    expect(bigintSqrt(4503599761588224n)).toBe(67108864n)
    expect(floorSqrtViolations(aroundSquares(range(2n ** 26n - 16n, 2n ** 26n + 16n)))).toEqual([])
  })

  it('returns the floor square root around perfect squares up to MAX_SAFE_ROOT^2', () => {
    const roots = [
      ...range(2n, 4096n),
      ...range(4096n, MAX_SAFE_ROOT, 4999n),
      ...range(MAX_SAFE_ROOT - 1024n, MAX_SAFE_ROOT),
    ]

    expect(floorSqrtViolations(aroundSquares(roots))).toEqual([])
  })

  it('returns the floor square root on both sides of Number.MAX_SAFE_INTEGER', () => {
    expect(bigintSqrt(MAX_SAFE_INTEGER)).toBe(MAX_SAFE_ROOT)
    expect(bigintSqrt(MAX_SAFE_INTEGER + 1n)).toBe(MAX_SAFE_ROOT)
    expect(bigintSqrt((MAX_SAFE_ROOT + 1n) ** 2n - 1n)).toBe(MAX_SAFE_ROOT)
    expect(bigintSqrt((MAX_SAFE_ROOT + 1n) ** 2n)).toBe(MAX_SAFE_ROOT + 1n)
  })

  describe('satisfies r * r <= value < (r + 1) * (r + 1) for random inputs', () => {
    it('values of every bit length up to 256', () => {
      const random = createRandomBits(0x5eedn)
      const values = range(1n, 256n).flatMap((bits) =>
        Array.from({ length: 40 }, () => random(bits) | (1n << (bits - 1n))),
      )

      expect(floorSqrtViolations(values)).toEqual([])
    })

    it('values next to the squares of random roots', () => {
      const random = createRandomBits(0xc0ffeen)
      const safeRoots = Array.from(
        { length: 4000 },
        () => 2n ** 26n + (random(32n) % (MAX_SAFE_ROOT - 2n ** 26n + 1n)),
      )
      const roots = range(2n, 128n).flatMap((bits) =>
        Array.from({ length: 40 }, () => random(bits) | (1n << (bits - 1n))),
      )

      expect(floorSqrtViolations(aroundSquares([...safeRoots, ...roots]))).toEqual([])
    })
  })

  describe('correct for all even powers of 2', () => {
    for (let i = 0; i < 256; i++) {
      it(`2^${i * 2}`, () => {
        const root = 2n ** BigInt(i)
        const rootSquared = root * root
        expect(bigintSqrt(rootSquared)).toBe(root)
      })
    }
  })

  it('correct for UINT_256_MAX', () => {
    expect(bigintSqrt(UINT_256_MAX)).toBe(BigInt('340282366920938463463374607431768211455'))
  })

  it('rejects negative values', () => {
    expect(() => bigintSqrt(-1n)).toThrow('square root of negative numbers is not supported')
  })
})
