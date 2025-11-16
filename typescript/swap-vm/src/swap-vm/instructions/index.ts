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
import * as stableSwap from './stable-swap'
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
   * Controls (11-16)
   */
  controls.jump, // 11 - JUMP
  controls.jumpIfExactIn, // 12 - JUMP_IF_EXACT_IN
  controls.jumpIfExactOut, // 13 - JUMP_IF_EXACT_OUT
  controls.onlyTakerTokenBalanceNonZero, // 14 - ONLY_TAKER_TOKEN_BALANCE_NON_ZERO
  controls.onlyTakerTokenBalanceGte, // 15 - ONLY_TAKER_TOKEN_BALANCE_GTE
  controls.onlyTakerTokenSupplyShareGte, // 16 - ONLY_TAKER_TOKEN_SUPPLY_SHARE_GTE

  /**
   * Balances (17-18)
   */
  balances.SET_BALANCES_XD_OPCODE, // 17 - SET_BALANCES_XD
  balances.BALANCES_XD_OPCODE, // 18 - BALANCES_XD

  /**
   * Invalidators (19-21)
   */
  invalidators.invalidateBit1D, // 19 - INVALIDATE_BIT_1D
  invalidators.invalidateTokenIn1D, // 20 - INVALIDATE_TOKEN_IN_1D
  invalidators.invalidateTokenOut1D, // 21 - INVALIDATE_TOKEN_OUT_1D

  /**
   * Trading instructions (22+)
   */
  xycSwap.xycSwapXD, // 22 - XYC_SWAP_XD
  concentrate.concentrateGrowLiquidityXD, // 23 - CONCENTRATE_GROW_LIQUIDITY_XD
  concentrate.concentrateGrowLiquidity2D, // 24 - CONCENTRATE_GROW_LIQUIDITY_2D
  decay.decayXD, // 25 - DECAY_XD
  limitSwap.limitSwap1D, // 26 - LIMIT_SWAP_1D
  limitSwap.limitSwapOnlyFull1D, // 27 - LIMIT_SWAP_ONLY_FULL_1D
  minRate.requireMinRate1D, // 28 - REQUIRE_MIN_RATE_1D
  minRate.adjustMinRate1D, // 29 - ADJUST_MIN_RATE_1D
  dutchAuction.dutchAuctionAmountIn1D, // 30 - DUTCH_AUCTION_AMOUNT_IN_1D
  dutchAuction.dutchAuctionAmountOut1D, // 31 - DUTCH_AUCTION_AMOUNT_OUT_1D
  oraclePriceAdjuster.oraclePriceAdjuster1D, // 32 - ORACLE_PRICE_ADJUSTER_1D
  baseFeeAdjuster.baseFeeAdjuster1D, // 33 - BASE_FEE_ADJUSTER_1D
  twapSwap.twap, // 34 - TWAP
  stableSwap.stableSwap2D, // 35 - STABLE_SWAP_2D
  extruction.extruction, // 36 - EXTRUCTION
  controls.salt, // 37 - SALT
  fee.flatFeeXD, // 38 - FLAT_FEE_XD
  fee.flatFeeAmountInXD, // 39 - FLAT_FEE_AMOUNT_IN_XD
  fee.flatFeeAmountOutXD, // 40 - FLAT_FEE_AMOUNT_OUT_XD
  fee.progressiveFeeXD, // 41 - PROGRESSIVE_FEE_XD
  fee.protocolFeeAmountOutXD, // 42 - PROTOCOL_FEE_AMOUNT_OUT_XD
  fee.aquaProtocolFeeAmountOutXD, // 43 - AQUA_PROTOCOL_FEE_AMOUNT_OUT_XD
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
   * Controls (11-16)
   */
  controls.jump, // 11 - JUMP
  controls.jumpIfExactIn, // 12 - JUMP_IF_EXACT_IN
  controls.jumpIfExactOut, // 13 - JUMP_IF_EXACT_OUT
  controls.deadline, // 14 - DEADLINE
  controls.onlyTakerTokenBalanceNonZero, // 15 - ONLY_TAKER_TOKEN_BALANCE_NON_ZERO
  controls.onlyTakerTokenBalanceGte, // 16 - ONLY_TAKER_TOKEN_BALANCE_GTE
  controls.onlyTakerTokenSupplyShareGte, // 17 - ONLY_TAKER_TOKEN_SUPPLY_SHARE_GTE

  /**
   * Trading instructions (18+)
   */
  xycSwap.xycSwapXD, // 18 - XYC_SWAP_XD (was 22 in regular)
  concentrate.concentrateGrowLiquidityXD, // 19 - CONCENTRATE_GROW_LIQUIDITY_XD
  concentrate.concentrateGrowLiquidity2D, // 20 - CONCENTRATE_GROW_LIQUIDITY_2D
  decay.decayXD, // 21 - DECAY_XD
  // stableSwap.stableSwap2D, // 22 - STABLE_SWAP_2D
  controls.salt, // 23 - SALT
  fee.flatFeeXD, // 24 - FLAT_FEE_XD
  fee.flatFeeAmountInXD, // 25 - FLAT_FEE_AMOUNT_IN_XD
  fee.flatFeeAmountOutXD, // 26 - FLAT_FEE_AMOUNT_OUT_XD
  fee.progressiveFeeXD, // 27 - PROGRESSIVE_FEE_XD
  fee.protocolFeeAmountOutXD, // 28 - PROTOCOL_FEE_AMOUNT_OUT_XD
  fee.aquaProtocolFeeAmountOutXD, // 29 - AQUA_PROTOCOL_FEE_AMOUNT_OUT_XD
] as const
