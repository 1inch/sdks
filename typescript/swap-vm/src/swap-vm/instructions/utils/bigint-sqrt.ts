// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

/**
 * Integer square root rounded down, like OpenZeppelin `Math.sqrt` used on-chain.
 *
 * @param value non-negative integer
 * @returns the largest r such that r * r <= value
 * @throws if value is negative
 */
export function bigintSqrt(value: bigint): bigint {
  if (value < 0n) {
    throw new Error('square root of negative numbers is not supported')
  }

  if (value < 2n) {
    return value
  }

  if (value <= 9007199254740991n) {
    const root = BigInt(Math.floor(Math.sqrt(Number(value))))

    // Math.sqrt rounds to the nearest double, so the estimate is never below the integer root, but
    // just under a perfect square n^2 it can round up to n, e.g. Math.sqrt(2^52 + 2^27) is 2^26 + 1
    return root * root > value ? root - 1n : root
  }

  let x0 = value
  let x1 = (value / x0 + x0) >> 1n
  while (x1 < x0) {
    x0 = x1
    x1 = (value / x0 + x0) >> 1n
  }

  return x0
}
