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
// import * as stableSwap from './stable-swap' // Not in production
import * as fee from './fee'
import * as extruction from './extruction'
import type { Opcode } from './opcode'
import type { IArgsData } from './types'

export * from './types'
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
export * as stableSwap from './stable-swap'
export * as fee from './fee'
export * as extruction from './extruction'

/**
 * Regular opcodes array - matching SwapVM contract exactly (44 opcodes)
 * @see https://github.com/1inch/swap-vm/blob/main/src/opcodes/Opcodes.sol#L46
 */
export const _allInstructions: Opcode<IArgsData>[] = [
  /**
   * Debug slots (1-10) - reserved for debugging
   */
  EMPTY_OPCODE, // 1
  EMPTY_OPCODE, // 2
  EMPTY_OPCODE, // 3
  EMPTY_OPCODE, // 4
  EMPTY_OPCODE, // 5
  EMPTY_OPCODE, // 6
  EMPTY_OPCODE, // 7
  EMPTY_OPCODE, // 8
  EMPTY_OPCODE, // 9
  EMPTY_OPCODE, // 10

  /**
   * Controls (11-17)
   */
  controls.jump, // 11
  controls.jumpIfTokenIn, // 12
  controls.jumpIfTokenOut, // 13
  controls.deadline, // 14
  controls.onlyTakerTokenBalanceNonZero, // 15
  controls.onlyTakerTokenBalanceGte, // 16
  controls.onlyTakerTokenSupplyShareGte, // 17

  /**
   * Balances (18-19)
   */
  balances.staticBalancesXD, // 18
  balances.dynamicBalancesXD, // 19

  /**
   * Invalidators (20-22)
   */
  invalidators.invalidateBit1D, // 20
  invalidators.invalidateTokenIn1D, // 21
  invalidators.invalidateTokenOut1D, // 22

  /**
   * Trading instructions (23+)
   */
  xycSwap.xycSwapXD, // 23
  concentrate.concentrateGrowLiquidity2D, // 24
  decay.decayXD, // 25
  limitSwap.limitSwap1D, // 26
  limitSwap.limitSwapOnlyFull1D, // 27
  minRate.requireMinRate1D, // 28
  minRate.adjustMinRate1D, // 29
  dutchAuction.dutchAuctionBalanceIn1D, // 30
  dutchAuction.dutchAuctionBalanceOut1D, // 31
  baseFeeAdjuster.baseFeeAdjuster1D, // 32
  twapSwap.twap, // 33
  extruction.extruction, // 34
  controls.salt, // 35
  fee.flatFeeAmountInXD, // 36
  fee.flatFeeAmountOutXD, // 37
  fee.progressiveFeeInXD, // 38
  fee.progressiveFeeOutXD, // 39
  fee.protocolFeeAmountOutXD, // 40
  fee.aquaProtocolFeeAmountOutXD, // 41
  // todo: Pegged swap // 42
  fee.protocolFeeAmountInXD, // 43
  fee.aquaProtocolFeeAmountInXD, // 44
  fee.dynamicProtocolFeeAmountInXD, // 45
  fee.aquaDynamicProtocolFeeAmountInXD, // 46
] as const

/**
 * Aqua opcodes array - matching AquaSwapVM contract (29 opcodes)
 * @see https://github.com/1inch/swap-vm/blob/main/src/opcodes/AquaOpcodes.sol#L28
 */
export const aquaInstructions: Opcode<IArgsData>[] = [
  /**
   * Debug slots (1-10) - reserved for debugging
   */
  EMPTY_OPCODE, // 1
  EMPTY_OPCODE, // 2
  EMPTY_OPCODE, // 3
  EMPTY_OPCODE, // 4
  EMPTY_OPCODE, // 5
  EMPTY_OPCODE, // 6
  EMPTY_OPCODE, // 7
  EMPTY_OPCODE, // 8
  EMPTY_OPCODE, // 9
  EMPTY_OPCODE, // 10

  /**
   * Controls (11-17)
   */
  controls.jump, // 11
  controls.jumpIfTokenIn, // 12
  controls.jumpIfTokenOut, // 13
  controls.deadline, // 14
  controls.onlyTakerTokenBalanceNonZero, // 15
  controls.onlyTakerTokenBalanceGte, // 16
  controls.onlyTakerTokenSupplyShareGte, // 17

  /**
   * Trading instructions (18+)
   */
  xycSwap.xycSwapXD, // 18
  concentrate.concentrateGrowLiquidity2D, // 19
  decay.decayXD, // 20
  controls.salt, // 21
  fee.flatFeeAmountInXD, // 22
  EMPTY_OPCODE, // 23
  EMPTY_OPCODE, // 24
  EMPTY_OPCODE, // 25
  EMPTY_OPCODE, // 26
  EMPTY_OPCODE, // 27
  fee.protocolFeeAmountInXD, // 28
  fee.aquaProtocolFeeAmountInXD, // 29
  fee.dynamicProtocolFeeAmountInXD, // 30
  fee.aquaDynamicProtocolFeeAmountInXD, // 31
  // todo: Pegged swap // 32
  extruction.extruction, // 33
] as const
