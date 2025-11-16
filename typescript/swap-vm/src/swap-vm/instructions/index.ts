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
import * as oraclePriceAdjuster from './oracle-price-adjuster'
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
  controls.jump, // 11 - JUMP
  controls.jumpIfTokenIn, // 12 - JUMP_IF_TOKEN_IN
  controls.jumpIfTokenOut, // 13 - JUMP_IF_TOKEN_OUT
  controls.deadline, // 14 - DEADLINE
  controls.onlyTakerTokenBalanceNonZero, // 15 - ONLY_TAKER_TOKEN_BALANCE_NON_ZERO
  controls.onlyTakerTokenBalanceGte, // 16 - ONLY_TAKER_TOKEN_BALANCE_GTE
  controls.onlyTakerTokenSupplyShareGte, // 17 - ONLY_TAKER_TOKEN_SUPPLY_SHARE_GTE

  /**
   * Balances (18-19)
   */
  balances.staticBalancesXD, // 18 - STATIC_BALANCES_XD
  balances.dynamicBalancesXD, // 19 - DYNAMIC_BALANCES_XD

  /**
   * Invalidators (20-22)
   */
  invalidators.invalidateBit1D, // 20 - INVALIDATE_BIT_1D
  invalidators.invalidateTokenIn1D, // 21 - INVALIDATE_TOKEN_IN_1D
  invalidators.invalidateTokenOut1D, // 22 - INVALIDATE_TOKEN_OUT_1D

  /**
   * Trading instructions (23+)
   */
  xycSwap.xycSwapXD, // 23 - XYC_SWAP_XD
  concentrate.concentrateGrowLiquidityXD, // 24 - CONCENTRATE_GROW_LIQUIDITY_XD
  concentrate.concentrateGrowLiquidity2D, // 25 - CONCENTRATE_GROW_LIQUIDITY_2D
  decay.decayXD, // 26 - DECAY_XD
  limitSwap.limitSwap1D, // 27 - LIMIT_SWAP_1D
  limitSwap.limitSwapOnlyFull1D, // 28 - LIMIT_SWAP_ONLY_FULL_1D
  minRate.requireMinRate1D, // 29 - REQUIRE_MIN_RATE_1D
  minRate.adjustMinRate1D, // 30 - ADJUST_MIN_RATE_1D
  dutchAuction.dutchAuctionBalanceIn1D, // 31 - DUTCH_AUCTION_BALANCE_IN_1D
  dutchAuction.dutchAuctionBalanceOut1D, // 32 - DUTCH_AUCTION_BALANCE_OUT_1D
  oraclePriceAdjuster.oraclePriceAdjuster1D, // 33 - ORACLE_PRICE_ADJUSTER_1D
  baseFeeAdjuster.baseFeeAdjuster1D, // 34 - BASE_FEE_ADJUSTER_1D
  twapSwap.twap, // 35 - TWAP
  extruction.extruction, // 36 - EXTRUCTION
  controls.salt, // 37 - SALT
  fee.flatFeeAmountInXD, // 38 - FLAT_FEE_AMOUNT_IN_XD
  fee.flatFeeAmountOutXD, // 39 - FLAT_FEE_AMOUNT_OUT_XD
  fee.progressiveFeeInXD, // 40 - PROGRESSIVE_FEE_IN_XD
  fee.progressiveFeeOutXD, // 41 - PROGRESSIVE_FEE_OUT_XD
  fee.protocolFeeAmountOutXD, // 42 - PROTOCOL_FEE_AMOUNT_OUT_XD
  fee.aquaProtocolFeeAmountOutXD, // 43 - AQUA_PROTOCOL_FEE_AMOUNT_OUT_XD
  // stableSwap.stableSwap2D, // STABLE_SWAP_2D - not in production
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
  controls.jump, // 11 - JUMP
  controls.jumpIfTokenIn, // 12 - JUMP_IF_TOKEN_IN
  controls.jumpIfTokenOut, // 13 - JUMP_IF_TOKEN_OUT
  controls.deadline, // 14 - DEADLINE
  controls.onlyTakerTokenBalanceNonZero, // 15 - ONLY_TAKER_TOKEN_BALANCE_NON_ZERO
  controls.onlyTakerTokenBalanceGte, // 16 - ONLY_TAKER_TOKEN_BALANCE_GTE
  controls.onlyTakerTokenSupplyShareGte, // 17 - ONLY_TAKER_TOKEN_SUPPLY_SHARE_GTE

  /**
   * Trading instructions (18+)
   */
  xycSwap.xycSwapXD, // 18 - XYC_SWAP_XD
  concentrate.concentrateGrowLiquidityXD, // 19 - CONCENTRATE_GROW_LIQUIDITY_XD
  concentrate.concentrateGrowLiquidity2D, // 20 - CONCENTRATE_GROW_LIQUIDITY_2D
  decay.decayXD, // 21 - DECAY_XD
  controls.salt, // 22 - SALT
  fee.flatFeeAmountInXD, // 23 - FLAT_FEE_AMOUNT_IN_XD
  fee.flatFeeAmountOutXD, // 24 - FLAT_FEE_AMOUNT_OUT_XD
  fee.progressiveFeeInXD, // 25 - PROGRESSIVE_FEE_IN_XD
  fee.progressiveFeeOutXD, // 26 - PROGRESSIVE_FEE_OUT_XD
  fee.protocolFeeAmountOutXD, // 27 - PROTOCOL_FEE_AMOUNT_OUT_XD
  fee.aquaProtocolFeeAmountOutXD, // 28 - AQUA_PROTOCOL_FEE_AMOUNT_OUT_XD
] as const
