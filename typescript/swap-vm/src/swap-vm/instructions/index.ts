import {emptyInstruction} from './empty'
import {setBalancesXD, balancesXD} from './balances'

export * from './balances'
export * from './types'

/**
 * Regular opcodes array - matching SwapVM contract exactly (44 opcodes)
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/opcodes/Opcodes.sol#L46
 */
export const allInstructions = [
    /**
     *  0 - NOT_INSTRUCTION
     */
    emptyInstruction, // 0 - NOT_INSTRUCTION

    /**
     * Debug slots (1-10) - reserved for debugging
     */
    emptyInstruction, // 1
    emptyInstruction, // 2
    emptyInstruction, // 3
    emptyInstruction, // 4
    emptyInstruction, // 5
    emptyInstruction, // 6
    emptyInstruction, // 7
    emptyInstruction, // 8
    emptyInstruction, // 9
    emptyInstruction, // 10

    /**
     * Controls (11-16)
     */
    emptyInstruction, // 11 - JUMP
    emptyInstruction, // 12 - JUMP_IF_EXACT_IN
    emptyInstruction, // 13 - JUMP_IF_EXACT_OUT
    emptyInstruction, // 14 - ONLY_TAKER_TOKEN_BALANCE_NON_ZERO
    emptyInstruction, // 15 - ONLY_TAKER_TOKEN_BALANCE_GTE
    emptyInstruction, // 16 - ONLY_TAKER_TOKEN_SUPPLY_SHARE_GTE

    /**
     * Balances (17-18)
     */
    setBalancesXD, // 17 - SET_BALANCES_XD
    balancesXD, // 18 - BALANCES_XD

    /**
     * Invalidators (19-21)
     */
    emptyInstruction, // 19 - INVALIDATE_BIT_1D
    emptyInstruction, // 20 - INVALIDATE_TOKEN_IN_1D
    emptyInstruction, // 21 - INVALIDATE_TOKEN_OUT_1D

    /**
     * Trading instructions (22+)
     */
    emptyInstruction, // 22 - XYC_SWAP_XD
    emptyInstruction, // 23 - CONCENTRATE_GROW_LIQUIDITY_XD
    emptyInstruction, // 24 - CONCENTRATE_GROW_LIQUIDITY_2D
    emptyInstruction, // 25 - DECAY_XD
    emptyInstruction, // 26 - LIMIT_SWAP_1D
    emptyInstruction, // 27 - LIMIT_SWAP_ONLY_FULL_1D
    emptyInstruction, // 28 - REQUIRE_MIN_RATE_1D
    emptyInstruction, // 29 - ADJUST_MIN_RATE_1D
    emptyInstruction, // 30 - DUTCH_AUCTION_AMOUNT_IN_1D
    emptyInstruction, // 31 - DUTCH_AUCTION_AMOUNT_OUT_1D
    emptyInstruction, // 32 - ORACLE_PRICE_ADJUSTER_1D
    emptyInstruction, // 33 - BASE_FEE_ADJUSTER_1D
    emptyInstruction, // 34 - TWAP
    emptyInstruction, // 35 - STABLE_SWAP_2D
    emptyInstruction, // 36 - EXTRUCTION
    emptyInstruction, // 37 - SALT
    emptyInstruction, // 38 - FLAT_FEE_XD
    emptyInstruction, // 39 - FLAT_FEE_AMOUNT_IN_XD
    emptyInstruction, // 40 - FLAT_FEE_AMOUNT_OUT_XD
    emptyInstruction, // 41 - PROGRESSIVE_FEE_XD
    emptyInstruction, // 42 - PROTOCOL_FEE_AMOUNT_OUT_XD
    emptyInstruction // 43 - AQUA_PROTOCOL_FEE_AMOUNT_OUT_XD
] as const

/**
 * Aqua opcodes array - matching AquaSwapVM contract (29 opcodes)
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/opcodes/AquaOpcodes.sol#L28
 */
export const aquaInstructions = [
    /**
     *  0 - NOT_INSTRUCTION
     */
    emptyInstruction, // 0 - NOT_INSTRUCTION

    /**
     * Debug slots (1-10) - reserved for debugging
     */
    emptyInstruction, // 1
    emptyInstruction, // 2
    emptyInstruction, // 3
    emptyInstruction, // 4
    emptyInstruction, // 5
    emptyInstruction, // 6
    emptyInstruction, // 7
    emptyInstruction, // 8
    emptyInstruction, // 9
    emptyInstruction, // 10

    /**
     * Controls (11-16)
     */
    emptyInstruction, // 11 - JUMP
    emptyInstruction, // 12 - JUMP_IF_EXACT_IN
    emptyInstruction, // 13 - JUMP_IF_EXACT_OUT
    emptyInstruction, // 14 - ONLY_TAKER_TOKEN_BALANCE_NON_ZERO
    emptyInstruction, // 15 - ONLY_TAKER_TOKEN_BALANCE_GTE
    emptyInstruction, // 16 - ONLY_TAKER_TOKEN_SUPPLY_SHARE_GTE

    /**
     * Trading instructions (17+)
     */
    emptyInstruction, // 17 - XYC_SWAP_XD (was 22 in regular)
    emptyInstruction, // 18 - CONCENTRATE_GROW_LIQUIDITY_XD
    emptyInstruction, // 19 - CONCENTRATE_GROW_LIQUIDITY_2D
    emptyInstruction, // 20 - DECAY_XD
    emptyInstruction, // 21 - STABLE_SWAP_2D
    emptyInstruction, // 22 - SALT
    emptyInstruction, // 23 - FLAT_FEE_XD
    emptyInstruction, // 24 - FLAT_FEE_AMOUNT_IN_XD
    emptyInstruction, // 25 - FLAT_FEE_AMOUNT_OUT_XD
    emptyInstruction, // 26 - PROGRESSIVE_FEE_XD
    emptyInstruction, // 27 - PROTOCOL_FEE_AMOUNT_OUT_XD
    emptyInstruction // 28 - AQUA_PROTOCOL_FEE_AMOUNT_OUT_XD
] as const
