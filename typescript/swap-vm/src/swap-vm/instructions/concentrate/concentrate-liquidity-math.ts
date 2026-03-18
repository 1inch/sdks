// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { UINT_256_MAX } from '@1inch/byte-utils'

const ONE = 10n ** 18n

/**
 * Compute max achievable L from available token amounts at a given spot price.
 * Takes the minimum of L implied by each token, then returns the resulting
 * targetL and the actual amounts (actualLt, actualGt) needed.
 *
 * Mirrors XYCConcentrateArgsBuilder.computeLiquidityFromAmounts in XYCConcentrate.sol.
 *
 * @param availableLt Available amount of token with lower address
 * @param availableGt Available amount of token with higher address
 * @param sqrtPspot sqrt(P_spot) in 1e18 fixed-point
 * @param sqrtPmin sqrt(P_min) in 1e18 fixed-point
 * @param sqrtPmax sqrt(P_max) in 1e18 fixed-point
 * @returns { targetL, actualLt, actualGt } max L and amounts actually needed (<= available)
 */
export function computeLiquidityFromAmounts(
  availableLt: bigint,
  availableGt: bigint,
  sqrtPspot: bigint,
  sqrtPmin: bigint,
  sqrtPmax: bigint,
): { targetL: bigint; actualLt: bigint; actualGt: bigint } {
  if (sqrtPmin >= sqrtPmax) {
    throw new Error('sqrtPmax should be greater than sqrtPmin')
  }

  const invSqrtPspot = mulDiv(ONE, ONE, sqrtPspot)
  const invSqrtPmax = mulDiv(ONE, ONE, sqrtPmax)

  const lFromLt =
    invSqrtPspot > invSqrtPmax ? mulDiv(availableLt, ONE, invSqrtPspot - invSqrtPmax) : UINT_256_MAX

  const lFromGt =
    sqrtPspot > sqrtPmin ? mulDiv(availableGt, ONE, sqrtPspot - sqrtPmin) : UINT_256_MAX

  const targetL = lFromLt < lFromGt ? lFromLt : lFromGt
  const { bLt: actualLt, bGt: actualGt } = computeBalances(targetL, sqrtPspot, sqrtPmin, sqrtPmax)

  return { targetL, actualLt, actualGt }
}

/**
 * Compute the initial balances for given L, P_spot, P_min, P_max:
 *   bLt = L * (1/sqrtPspot - 1/sqrtPmax)
 *   bGt = L * (sqrtPspot - sqrtPmin)
 *
 * Mirrors XYCConcentrateArgsBuilder.computeBalances in XYCConcentrate.sol.
 *
 * @param targetL Liquidity L (1e18 scale implied by ONE)
 * @param sqrtPspot sqrt(P_spot) in 1e18 fixed-point
 * @param sqrtPmin sqrt(P_min) in 1e18 fixed-point
 * @param sqrtPmax sqrt(P_max) in 1e18 fixed-point
 * @returns { bLt, bGt } amounts of tokenLt and tokenGt for the given L and prices
 */
export function computeBalances(
  targetL: bigint,
  sqrtPspot: bigint,
  sqrtPmin: bigint,
  sqrtPmax: bigint,
): { bLt: bigint; bGt: bigint } {
  if (sqrtPmin >= sqrtPmax) {
    throw new Error('sqrtPmax should be greater than sqrtPmin')
  }

  const invSqrtPspot = mulDiv(ONE, ONE, sqrtPspot)
  const invSqrtPmax = mulDiv(ONE, ONE, sqrtPmax)
  const bLt = invSqrtPspot > invSqrtPmax ? mulDiv(targetL, invSqrtPspot - invSqrtPmax, ONE) : 0n
  const bGt = sqrtPspot > sqrtPmin ? mulDiv(targetL, sqrtPspot - sqrtPmin, ONE) : 0n

  return { bLt, bGt }
}

function mulDiv(a: bigint, b: bigint, c: bigint): bigint {
  if (c === 0n) {
    throw new Error('mulDiv: division by zero')
  }

  return (a * b) / c
}
