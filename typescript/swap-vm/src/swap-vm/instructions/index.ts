import {EMPTY_OPCODE} from './empty'
import * as balances from './balances'
import * as controls from './controls'
import * as invalidators from './invalidators'
import * as xycSwap from './xyc-swap'
import * as concentrate from './concentrate'
import * as decay from './decay'

export * from './types'
export * from './balances'
export * from './controls'
export * from './invalidators'
export * from './xyc-swap'
export * from './concentrate'
export * from './decay'

/**
 * Regular opcodes array - matching SwapVM contract exactly (44 opcodes)
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/opcodes/Opcodes.sol#L46
 */
export const allInstructions = [
    /**
     *  0 - NOT_INSTRUCTION
     */
    EMPTY_OPCODE, // 0 - NOT_INSTRUCTION

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
    EMPTY_OPCODE, // 26 - LIMIT_SWAP_1D
    EMPTY_OPCODE, // 27 - LIMIT_SWAP_ONLY_FULL_1D
    EMPTY_OPCODE, // 28 - REQUIRE_MIN_RATE_1D
    EMPTY_OPCODE, // 29 - ADJUST_MIN_RATE_1D
    EMPTY_OPCODE, // 30 - DUTCH_AUCTION_AMOUNT_IN_1D
    EMPTY_OPCODE, // 31 - DUTCH_AUCTION_AMOUNT_OUT_1D
    EMPTY_OPCODE, // 32 - ORACLE_PRICE_ADJUSTER_1D
    EMPTY_OPCODE, // 33 - BASE_FEE_ADJUSTER_1D
    EMPTY_OPCODE, // 34 - TWAP
    EMPTY_OPCODE, // 35 - STABLE_SWAP_2D
    EMPTY_OPCODE, // 36 - EXTRUCTION
    controls.salt, // 37 - SALT
    EMPTY_OPCODE, // 38 - FLAT_FEE_XD
    EMPTY_OPCODE, // 39 - FLAT_FEE_AMOUNT_IN_XD
    EMPTY_OPCODE, // 40 - FLAT_FEE_AMOUNT_OUT_XD
    EMPTY_OPCODE, // 41 - PROGRESSIVE_FEE_XD
    EMPTY_OPCODE, // 42 - PROTOCOL_FEE_AMOUNT_OUT_XD
    EMPTY_OPCODE // 43 - AQUA_PROTOCOL_FEE_AMOUNT_OUT_XD
] as const

/**
 * Aqua opcodes array - matching AquaSwapVM contract (29 opcodes)
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/opcodes/AquaOpcodes.sol#L28
 */
export const aquaInstructions = [
    /**
     *  0 - NOT_INSTRUCTION
     */
    EMPTY_OPCODE, // 0 - NOT_INSTRUCTION

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
     * Trading instructions (17+)
     */
    xycSwap.xycSwapXD, // 17 - XYC_SWAP_XD (was 22 in regular)
    concentrate.concentrateGrowLiquidityXD, // 18 - CONCENTRATE_GROW_LIQUIDITY_XD
    concentrate.concentrateGrowLiquidity2D, // 19 - CONCENTRATE_GROW_LIQUIDITY_2D
    decay.decayXD, // 20 - DECAY_XD
    EMPTY_OPCODE, // 21 - STABLE_SWAP_2D
    controls.salt, // 22 - SALT
    EMPTY_OPCODE, // 23 - FLAT_FEE_XD
    EMPTY_OPCODE, // 24 - FLAT_FEE_AMOUNT_IN_XD
    EMPTY_OPCODE, // 25 - FLAT_FEE_AMOUNT_OUT_XD
    EMPTY_OPCODE, // 26 - PROGRESSIVE_FEE_XD
    EMPTY_OPCODE, // 27 - PROTOCOL_FEE_AMOUNT_OUT_XD
    EMPTY_OPCODE // 28 - AQUA_PROTOCOL_FEE_AMOUNT_OUT_XD
] as const
