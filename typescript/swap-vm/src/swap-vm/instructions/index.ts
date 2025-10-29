import * as empty from './empty'
import * as Balances from './balances'

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
    empty.opcode, // 0 - NOT_INSTRUCTION

    /**
     * Debug slots (1-10) - reserved for debugging
     */
    empty.opcode, // 1
    empty.opcode, // 2
    empty.opcode, // 3
    empty.opcode, // 4
    empty.opcode, // 5
    empty.opcode, // 6
    empty.opcode, // 7
    empty.opcode, // 8
    empty.opcode, // 9
    empty.opcode, // 10

    /**
     * Controls (11-16)
     */
    empty.opcode, // 11 - JUMP
    empty.opcode, // 12 - JUMP_IF_EXACT_IN
    empty.opcode, // 13 - JUMP_IF_EXACT_OUT
    empty.opcode, // 14 - ONLY_TAKER_TOKEN_BALANCE_NON_ZERO
    empty.opcode, // 15 - ONLY_TAKER_TOKEN_BALANCE_GTE
    empty.opcode, // 16 - ONLY_TAKER_TOKEN_SUPPLY_SHARE_GTE

    /**
     * Balances (17-18)
     */
    new Balances.SetBalancesXDOpcode(), // 17 - SET_BALANCES_XD
    new Balances.BalancesXDOpcode(), // 18 - BALANCES_XD

    /**
     * Invalidators (19-21)
     */
    empty.opcode, // 19 - INVALIDATE_BIT_1D
    empty.opcode, // 20 - INVALIDATE_TOKEN_IN_1D
    empty.opcode, // 21 - INVALIDATE_TOKEN_OUT_1D

    /**
     * Trading instructions (22+)
     */
    empty.opcode, // 22 - XYC_SWAP_XD
    empty.opcode, // 23 - CONCENTRATE_GROW_LIQUIDITY_XD
    empty.opcode, // 24 - CONCENTRATE_GROW_LIQUIDITY_2D
    empty.opcode, // 25 - DECAY_XD
    empty.opcode, // 26 - LIMIT_SWAP_1D
    empty.opcode, // 27 - LIMIT_SWAP_ONLY_FULL_1D
    empty.opcode, // 28 - REQUIRE_MIN_RATE_1D
    empty.opcode, // 29 - ADJUST_MIN_RATE_1D
    empty.opcode, // 30 - DUTCH_AUCTION_AMOUNT_IN_1D
    empty.opcode, // 31 - DUTCH_AUCTION_AMOUNT_OUT_1D
    empty.opcode, // 32 - ORACLE_PRICE_ADJUSTER_1D
    empty.opcode, // 33 - BASE_FEE_ADJUSTER_1D
    empty.opcode, // 34 - TWAP
    empty.opcode, // 35 - STABLE_SWAP_2D
    empty.opcode, // 36 - EXTRUCTION
    empty.opcode, // 37 - SALT
    empty.opcode, // 38 - FLAT_FEE_XD
    empty.opcode, // 39 - FLAT_FEE_AMOUNT_IN_XD
    empty.opcode, // 40 - FLAT_FEE_AMOUNT_OUT_XD
    empty.opcode, // 41 - PROGRESSIVE_FEE_XD
    empty.opcode, // 42 - PROTOCOL_FEE_AMOUNT_OUT_XD
    empty.opcode // 43 - AQUA_PROTOCOL_FEE_AMOUNT_OUT_XD
] as const

/**
 * Aqua opcodes array - matching AquaSwapVM contract (29 opcodes)
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/opcodes/AquaOpcodes.sol#L28
 */
export const aquaInstructions = [
    /**
     *  0 - NOT_INSTRUCTION
     */
    empty.opcode, // 0 - NOT_INSTRUCTION

    /**
     * Debug slots (1-10) - reserved for debugging
     */
    empty.opcode, // 1
    empty.opcode, // 2
    empty.opcode, // 3
    empty.opcode, // 4
    empty.opcode, // 5
    empty.opcode, // 6
    empty.opcode, // 7
    empty.opcode, // 8
    empty.opcode, // 9
    empty.opcode, // 10

    /**
     * Controls (11-16)
     */
    empty.opcode, // 11 - JUMP
    empty.opcode, // 12 - JUMP_IF_EXACT_IN
    empty.opcode, // 13 - JUMP_IF_EXACT_OUT
    empty.opcode, // 14 - ONLY_TAKER_TOKEN_BALANCE_NON_ZERO
    empty.opcode, // 15 - ONLY_TAKER_TOKEN_BALANCE_GTE
    empty.opcode, // 16 - ONLY_TAKER_TOKEN_SUPPLY_SHARE_GTE

    /**
     * Trading instructions (17+)
     */
    empty.opcode, // 17 - XYC_SWAP_XD (was 22 in regular)
    empty.opcode, // 18 - CONCENTRATE_GROW_LIQUIDITY_XD
    empty.opcode, // 19 - CONCENTRATE_GROW_LIQUIDITY_2D
    empty.opcode, // 20 - DECAY_XD
    empty.opcode, // 21 - STABLE_SWAP_2D
    empty.opcode, // 22 - SALT
    empty.opcode, // 23 - FLAT_FEE_XD
    empty.opcode, // 24 - FLAT_FEE_AMOUNT_IN_XD
    empty.opcode, // 25 - FLAT_FEE_AMOUNT_OUT_XD
    empty.opcode, // 26 - PROGRESSIVE_FEE_XD
    empty.opcode, // 27 - PROTOCOL_FEE_AMOUNT_OUT_XD
    empty.opcode // 28 - AQUA_PROTOCOL_FEE_AMOUNT_OUT_XD
] as const
