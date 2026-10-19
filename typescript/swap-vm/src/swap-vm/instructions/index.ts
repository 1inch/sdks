// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { EMPTY_OPCODE } from './empty'
import * as balances from './balances'
import * as controls from './controls'
import * as invalidators from './invalidators'
import * as xycSwap from './xyc-swap'
import * as concentrate from './concentrate'
import * as decay from './decay'
import * as limitSwap from './limit-swap'
import * as minRate from './min-rate'
import * as dutchAuction from './dutch-auction'
import * as baseFeeAdjuster from './base-fee-adjuster'
import * as twapSwap from './twap-swap'
import * as fee from './fee'
import * as extruction from './extruction'
import type { Opcode } from './opcode'
import type { IArgsData } from './types'
import * as peggedSwap from './pegged-swap'

export * from './types'
export { bigintSqrt, truncateHumanDecimalString } from './utils'
export { EMPTY_OPCODE } from './empty'
export * as balances from './balances'
export * as controls from './controls'
export * as invalidators from './invalidators'
export * as xycSwap from './xyc-swap'
export * as concentrate from './concentrate'
export * as decay from './decay'
export * as limitSwap from './limit-swap'
export * as minRate from './min-rate'
export * as dutchAuction from './dutch-auction'
export * as oraclePriceAdjuster from './oracle-price-adjuster'
export * as baseFeeAdjuster from './base-fee-adjuster'
export * as twapSwap from './twap-swap'
// Deprecated alias of `peggedSwap`, kept for backward compatibility
// (TypeScript ignores `@deprecated` on `export * as` re-exports)
export * as stableSwap from './pegged-swap'
export * as fee from './fee'
export * as extruction from './extruction'
export * as peggedSwap from './pegged-swap'

/**
 * Regular opcodes array - matching SwapVM contract exactly (46 entries)
 * The array index is the opcode byte used in encoded programs
 * @see https://github.com/1inch/swap-vm/blob/main/src/opcodes/Opcodes.sol#L46
 */
export const _allInstructions: Opcode<IArgsData>[] = [
  /**
   * Debug slots (0-9) - reserved for debugging
   */
  EMPTY_OPCODE, // 0
  EMPTY_OPCODE, // 1
  EMPTY_OPCODE, // 2
  EMPTY_OPCODE, // 3
  EMPTY_OPCODE, // 4
  EMPTY_OPCODE, // 5
  EMPTY_OPCODE, // 6
  EMPTY_OPCODE, // 7
  EMPTY_OPCODE, // 8
  EMPTY_OPCODE, // 9

  /**
   * Controls (10-16)
   */
  controls.jump, // 10
  controls.jumpIfTokenIn, // 11
  controls.jumpIfTokenOut, // 12
  controls.deadline, // 13
  controls.onlyTakerTokenBalanceNonZero, // 14
  controls.onlyTakerTokenBalanceGte, // 15
  controls.onlyTakerTokenSupplyShareGte, // 16

  /**
   * Balances (17-18)
   */
  balances.staticBalancesXD, // 17
  balances.dynamicBalancesXD, // 18

  /**
   * Invalidators (19-21)
   */
  invalidators.invalidateBit1D, // 19
  invalidators.invalidateTokenIn1D, // 20
  invalidators.invalidateTokenOut1D, // 21

  /**
   * Trading instructions (22+)
   */
  xycSwap.xycSwapXD, // 22
  concentrate.concentrateGrowLiquidity2D, // 23
  decay.decayXD, // 24
  limitSwap.limitSwap1D, // 25
  limitSwap.limitSwapOnlyFull1D, // 26
  minRate.requireMinRate1D, // 27
  minRate.adjustMinRate1D, // 28
  dutchAuction.dutchAuctionBalanceIn1D, // 29
  dutchAuction.dutchAuctionBalanceOut1D, // 30
  baseFeeAdjuster.baseFeeAdjuster1D, // 31
  twapSwap.twap, // 32
  extruction.extruction, // 33
  controls.salt, // 34
  fee.flatFeeAmountInXD, // 35
  fee.flatFeeAmountOutXD, // 36
  fee.progressiveFeeInXD, // 37
  fee.progressiveFeeOutXD, // 38
  fee.protocolFeeAmountOutXD, // 39
  fee.aquaProtocolFeeAmountOutXD, // 40
  peggedSwap.peggedSwapGrowPriceRange2D, // 41
  fee.protocolFeeAmountInXD, // 42
  fee.aquaProtocolFeeAmountInXD, // 43
  fee.dynamicProtocolFeeAmountInXD, // 44
  fee.aquaDynamicProtocolFeeAmountInXD, // 45
] as const

/**
 * Aqua opcodes array - matching AquaSwapVM contract (34 entries)
 * The array index is the opcode byte used in encoded programs
 * @see https://github.com/1inch/swap-vm/blob/main/src/opcodes/AquaOpcodes.sol#L28
 */
export const aquaInstructions: Opcode<IArgsData>[] = [
  /**
   * Debug slots (0-9) - reserved for debugging
   */
  EMPTY_OPCODE, // 0
  EMPTY_OPCODE, // 1
  EMPTY_OPCODE, // 2
  EMPTY_OPCODE, // 3
  EMPTY_OPCODE, // 4
  EMPTY_OPCODE, // 5
  EMPTY_OPCODE, // 6
  EMPTY_OPCODE, // 7
  EMPTY_OPCODE, // 8
  EMPTY_OPCODE, // 9

  /**
   * Controls (10-16)
   */
  controls.jump, // 10
  controls.jumpIfTokenIn, // 11
  controls.jumpIfTokenOut, // 12
  controls.deadline, // 13
  controls.onlyTakerTokenBalanceNonZero, // 14
  controls.onlyTakerTokenBalanceGte, // 15
  controls.onlyTakerTokenSupplyShareGte, // 16

  /**
   * Trading instructions (17+)
   */
  xycSwap.xycSwapXD, // 17
  concentrate.concentrateGrowLiquidity2D, // 18
  decay.decayXD, // 19
  controls.salt, // 20
  fee.flatFeeAmountInXD, // 21
  EMPTY_OPCODE, // 22
  EMPTY_OPCODE, // 23
  EMPTY_OPCODE, // 24
  EMPTY_OPCODE, // 25
  EMPTY_OPCODE, // 26
  fee.protocolFeeAmountInXD, // 27
  fee.aquaProtocolFeeAmountInXD, // 28
  fee.dynamicProtocolFeeAmountInXD, // 29
  fee.aquaDynamicProtocolFeeAmountInXD, // 30
  peggedSwap.peggedSwapGrowPriceRange2D, // 31
  extruction.extruction, // 32
  controls.onlyTxOriginTokenBalanceNonZero, // 33
] as const
