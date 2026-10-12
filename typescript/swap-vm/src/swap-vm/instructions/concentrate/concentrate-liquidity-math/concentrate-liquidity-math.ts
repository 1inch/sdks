// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { UINT_256_MAX } from '@1inch/byte-utils'
import { bigintSqrt } from '../../utils/bigint-sqrt'

const ONE = 10n ** 18n

/**
 * Compute max achievable L from available token amounts at a given spot price.
 * Takes the minimum of L backed by each token, then returns the resulting
 * targetL and the actual amounts (actualLt, actualGt) needed.
 *
 * targetL is the largest L whose computeBalances reserves fit within the available amounts, so
 * actualLt <= availableLt and actualGt <= availableGt always hold, and the limiting token is
 * used in full whenever the integer liquidity grid allows it.
 *
 * Follows XYCConcentrateArgsBuilder.computeLiquidityFromAmounts in XYCConcentrate.sol, except
 * that each per-token L is the exact integer inverse of the matching computeBalances leg (see
 * computeLiquidityFromLt): the contract helper derives its `lFromLt` term from the product form,
 * which is not the inverse of its reciprocal-form computeBalances and therefore sizes the
 * limiting tokenLt a few wei to ~1e-13 relative above the available amount.
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

  const ltPerL = ltPerLiquidity(sqrtPspot, sqrtPmax)
  const gtPerL = gtPerLiquidity(sqrtPspot, sqrtPmin)

  // A token the range does not hold at this spot price does not bound L
  const lFromLt = ltPerL > 0n ? maxLiquidityWithin(availableLt, ltPerL) : UINT_256_MAX
  const lFromGt = gtPerL > 0n ? maxLiquidityWithin(availableGt, gtPerL) : UINT_256_MAX

  const targetL = lFromLt < lFromGt ? lFromLt : lFromGt

  return {
    targetL,
    actualLt: mulDiv(targetL, ltPerL, ONE),
    actualGt: mulDiv(targetL, gtPerL, ONE),
  }
}

/**
 * Compute the largest L that an amount of the token with lower address can back at a given
 * spot price, i.e. the largest L with computeBalances(L, ...).bLt <= availableLt:
 *   L = ((availableLt + 1) * ONE - 1) / (invSqrtPspot - invSqrtPmax)
 * on the same floored reciprocals (invSqrtP = ONE * ONE / sqrtP) that computeBalances uses for
 * its bLt leg, so the two are exact integer inverses and the fixed amount is never exceeded.
 *
 * The `lFromLt` term of XYCConcentrateArgsBuilder.computeLiquidityFromAmounts in
 * XYCConcentrate.sol uses the product form availableLt * (sqrtPmax * sqrtPspot / ONE) /
 * (sqrtPmax - sqrtPspot) instead. It is NOT used here: it is not the inverse of the
 * reciprocal-form computeBalances, so the bLt recomputed from it lands above availableLt (by
 * ~1e-13 relative on a 6/18-decimals pair: 0.15 USDC on 1M USDC), and its floored product loses
 * most of its precision as sqrtPmax * sqrtPspot approaches ONE (cheap tokenLt) and is 0 below it.
 *
 * @param availableLt Amount of token with lower address
 * @param sqrtPspot sqrt(P_spot) in 1e18 fixed-point, must be < sqrtPmax
 * @param sqrtPmax sqrt(P_max) in 1e18 fixed-point
 * @returns largest L backed by availableLt, 0 for a zero amount
 * @throws if sqrtPspot >= sqrtPmax (the range holds no tokenLt at this spot price)
 */
export function computeLiquidityFromLt(
  availableLt: bigint,
  sqrtPspot: bigint,
  sqrtPmax: bigint,
): bigint {
  if (sqrtPspot >= sqrtPmax) {
    throw new Error(
      'sqrtPspot should be less than sqrtPmax: the range holds no tokenLt at this spot price',
    )
  }

  const ltPerL = ltPerLiquidity(sqrtPspot, sqrtPmax)

  // sqrtPspot < sqrtPmax, but both reciprocals floor to the same value (sqrtP > ONE and a band
  // narrower than its own rounding step): computeBalances gives bLt = 0 for every L
  if (ltPerL === 0n) {
    throw new Error(
      'sqrtPspot and sqrtPmax are too close: the range holds no tokenLt at this spot price',
    )
  }

  return maxLiquidityWithin(availableLt, ltPerL)
}

/**
 * Compute the largest L that an amount of the token with higher address can back at a given
 * spot price, i.e. the largest L with computeBalances(L, ...).bGt <= availableGt:
 *   L = ((availableGt + 1) * ONE - 1) / (sqrtPspot - sqrtPmin)
 *
 * Exact integer inverse of the bGt leg of computeBalances, so the fixed amount is never exceeded.
 * Agrees with the `lFromGt` term of XYCConcentrateArgsBuilder.computeLiquidityFromAmounts in
 * XYCConcentrate.sol up to the last unit of L that still fits within availableGt.
 *
 * @param availableGt Amount of token with higher address
 * @param sqrtPspot sqrt(P_spot) in 1e18 fixed-point, must be > sqrtPmin
 * @param sqrtPmin sqrt(P_min) in 1e18 fixed-point
 * @returns largest L backed by availableGt, 0 for a zero amount
 * @throws if sqrtPspot <= sqrtPmin (the range holds no tokenGt at this spot price)
 */
export function computeLiquidityFromGt(
  availableGt: bigint,
  sqrtPspot: bigint,
  sqrtPmin: bigint,
): bigint {
  if (sqrtPspot <= sqrtPmin) {
    throw new Error(
      'sqrtPspot should be greater than sqrtPmin: the range holds no tokenGt at this spot price',
    )
  }

  return maxLiquidityWithin(availableGt, gtPerLiquidity(sqrtPspot, sqrtPmin))
}

/**
 * Compute the initial balances for given L, P_spot, P_min, P_max:
 *   bLt = L * (1/sqrtPspot - 1/sqrtPmax)
 *   bGt = L * (sqrtPspot - sqrtPmin)
 *
 * Mirrors XYCConcentrateArgsBuilder.computeBalances in XYCConcentrate.sol.
 *
 * The bLt leg is computed on reciprocal sqrt prices (invSqrtP = ONE * ONE / sqrtP).
 * The algebraically equivalent product form L * (sqrtPmax - sqrtPspot) / (sqrtPmax * sqrtPspot / ONE)
 * is NOT used: its floored denominator loses relative precision as sqrtPmax * sqrtPspot approaches
 * ONE (cheap tokenLt, e.g. an 18-decimal token0 priced at ~1e-6 of a 6-decimal token1), overstating
 * bLt manyfold, and collapses to zero below it — a division-by-zero the deployed contract does not have.
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

  return {
    bLt: mulDiv(targetL, ltPerLiquidity(sqrtPspot, sqrtPmax), ONE),
    bGt: mulDiv(targetL, gtPerLiquidity(sqrtPspot, sqrtPmin), ONE),
  }
}

/**
 * tokenLt per unit of L in 1e18 fixed-point: invSqrtPspot - invSqrtPmax on floored reciprocals,
 * as on-chain. 0 when the range holds no tokenLt at this spot price (sqrtPspot >= sqrtPmax, or
 * both reciprocals floor to the same value).
 */
function ltPerLiquidity(sqrtPspot: bigint, sqrtPmax: bigint): bigint {
  const invSqrtPspot = mulDiv(ONE, ONE, sqrtPspot)
  const invSqrtPmax = mulDiv(ONE, ONE, sqrtPmax)

  return invSqrtPspot > invSqrtPmax ? invSqrtPspot - invSqrtPmax : 0n
}

/**
 * tokenGt per unit of L in 1e18 fixed-point: sqrtPspot - sqrtPmin.
 * 0 when the range holds no tokenGt at this spot price (sqrtPspot <= sqrtPmin).
 */
function gtPerLiquidity(sqrtPspot: bigint, sqrtPmin: bigint): bigint {
  return sqrtPspot > sqrtPmin ? sqrtPspot - sqrtPmin : 0n
}

/**
 * Largest L whose leg floor(L * perLiquidity / ONE) stays within `amount`:
 * L * perLiquidity < (amount + 1) * ONE. A zero amount backs no liquidity.
 */
function maxLiquidityWithin(amount: bigint, perLiquidity: bigint): bigint {
  if (amount === 0n) {
    return 0n
  }

  return ((amount + 1n) * ONE - 1n) / perLiquidity
}

/**
 * Compute the implied spot price and liquidity from real balances and price bounds.
 *
 * Mirrors XYCConcentrateArgsBuilder.computeLiquidityAndPrice in XYCConcentrate.sol.
 *
 * @param balanceLt Real balance of the token with lower address
 * @param balanceGt Real balance of the token with higher address
 * @param sqrtPriceMin sqrt(P_min) in 1e18 fixed-point
 * @param sqrtPriceMax sqrt(P_max) in 1e18 fixed-point
 * @returns { liquidity, sqrtPriceSpot } L and implied sqrt(P_spot) in 1e18 fixed-point
 */
export function computeLiquidityAndPrice(
  balanceLt: bigint,
  balanceGt: bigint,
  sqrtPriceMin: bigint,
  sqrtPriceMax: bigint,
): { liquidity: bigint; sqrtPriceSpot: bigint } {
  const liquidity = computeL(balanceLt, balanceGt, sqrtPriceMin, sqrtPriceMax)
  const virtualLt = balanceLt + mulDiv(liquidity, ONE, sqrtPriceMax)
  const virtualGt = balanceGt + mulDiv(liquidity, sqrtPriceMin, ONE)
  const sqrtPriceSpot = bigintSqrt(mulDiv(virtualGt, ONE * ONE, virtualLt))

  return { liquidity, sqrtPriceSpot }
}

/**
 * Compute L from real balances and price bounds.
 * Mirrors XYCConcentrateArgsBuilder._computeL in XYCConcentrate.sol.
 */
function computeL(bLt: bigint, bGt: bigint, sqrtPriceMin: bigint, sqrtPriceMax: bigint): bigint {
  const alpha = ONE - mulDiv(sqrtPriceMin, ONE, sqrtPriceMax)
  const beta = mulDiv(bLt, sqrtPriceMin, ONE) + mulDiv(bGt, ONE, sqrtPriceMax)
  const fourAC = mulDiv(4n * alpha, bLt, ONE) * bGt
  const disc = beta * beta + fourAC

  return mulDiv(beta + bigintSqrt(disc), ONE, 2n * alpha)
}

function mulDiv(a: bigint, b: bigint, c: bigint): bigint {
  if (c === 0n) {
    throw new Error('mulDiv: division by zero')
  }

  return (a * b) / c
}
