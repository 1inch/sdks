// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

export function bigintSqrt(value: bigint): bigint {
  if (value < 0n) {
    throw new Error('square root of negative numbers is not supported')
  }

  if (value < 2n) {
    return value
  }

  if (value <= 9007199254740991n) {
    return BigInt(Math.floor(Math.sqrt(Number(value))))
  }

  let x0 = value
  let x1 = (value / x0 + x0) >> 1n
  while (x1 < x0) {
    x0 = x1
    x1 = (value / x0 + x0) >> 1n
  }

  return x0
}
