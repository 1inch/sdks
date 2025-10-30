import {JumpArgs} from './jump-args'
import {OnlyTakerTokenBalanceNonZeroArgs} from './only-taker-token-balance-non-zero-args'
import {OnlyTakerTokenBalanceGteArgs} from './only-taker-token-balance-gte-args'
import {OnlyTakerTokenSupplyShareGteArgs} from './only-taker-token-supply-share-gte-args'
import {SaltArgs} from './salt-args'
import {Opcode} from '../opcode'

/**
 *  Unconditional jump to specified program counter
 *  @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Controls.sol#L52
 **/
export const jump = new Opcode(Symbol('Controls.jump'), JumpArgs.CODER)

/**
 * Jump to specified program counter if swap mode is exact input
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Controls.sol#L59
 **/
export const jumpIfExactIn = new Opcode(
    Symbol('Controls.jumpIfExactIn'),
    JumpArgs.CODER
)

/**
 * Jump to specified program counter if swap mode is exact output
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Controls.sol#L68
 **/
export const jumpIfExactOut = new Opcode(
    Symbol('Controls.jumpIfExactOut'),
    JumpArgs.CODER
)

/**
 * Requires taker to hold any amount of specified token (supports NFTs)
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Controls.sol#L77
 **/
export const onlyTakerTokenBalanceNonZero = new Opcode(
    Symbol('Controls.onlyTakerTokenBalanceNonZero'),
    OnlyTakerTokenBalanceNonZeroArgs.CODER
)

/**
 * Requires taker to hold at least specified amount of token
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Controls.sol#L86
 */
export const onlyTakerTokenBalanceGte = new Opcode(
    Symbol('Controls.onlyTakerTokenBalanceGte'),
    OnlyTakerTokenBalanceGteArgs.CODER
)

/**
 * Requires taker to hold at least specified share of token's total supply
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Controls.sol#L96
 **/
export const onlyTakerTokenSupplyShareGte = new Opcode(
    Symbol('Controls.onlyTakerTokenSupplyShareGte'),
    OnlyTakerTokenSupplyShareGteArgs.CODER
)

/**
 * No-op instruction used to add uniqueness to order hashes (prevents replay attacks)
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Controls.sol#L48
 **/
export const salt = new Opcode(Symbol('Controls.salt'), SaltArgs.CODER)
