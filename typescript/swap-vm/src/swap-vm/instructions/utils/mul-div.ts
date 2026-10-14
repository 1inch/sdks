// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { UINT_256_MAX } from '@1inch/byte-utils'

/**
 * Compute floor(a * b / c) with a full-precision intermediate product.
 *
 * Mirrors OpenZeppelin `Math.mulDiv` used by the on-chain math: values outside uint256 are
 * rejected instead of being returned, so the SDK fails where the contract reverts.
 *
 * @param a uint256 multiplicand
 * @param b uint256 multiplier
 * @param c uint256 divisor, must be non-zero
 * @returns floor(a * b / c)
 * @throws if an operand is not a uint256, if c is zero, or if the result exceeds UINT_256_MAX
 */
export function mulDiv(a: bigint, b: bigint, c: bigint): bigint {
  if (!isUint256(a) || !isUint256(b) || !isUint256(c)) {
    throw new Error(`mulDiv: operands must be uint256 values, got ${a} * ${b} / ${c}`)
  }

  if (c === 0n) {
    throw new Error('mulDiv: division by zero')
  }

  const result = (a * b) / c

  if (result > UINT_256_MAX) {
    throw new Error(`mulDiv: result of ${a} * ${b} / ${c} exceeds UINT_256_MAX`)
  }

  return result
}

function isUint256(value: bigint): boolean {
  return value >= 0n && value <= UINT_256_MAX
}
