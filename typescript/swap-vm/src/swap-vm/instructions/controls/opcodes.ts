// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { JumpArgs } from './jump-args'
import { JumpIfTokenArgs } from './jump-if-token-args'
import { DeadlineArgs } from './deadline-args'
import { OnlyTakerTokenBalanceNonZeroArgs } from './only-taker-token-balance-non-zero-args'
import { OnlyTakerTokenBalanceGteArgs } from './only-taker-token-balance-gte-args'
import { OnlyTakerTokenSupplyShareGteArgs } from './only-taker-token-supply-share-gte-args'
import { SaltArgs } from './salt-args'
import { Opcode } from '../opcode'

/**
 *  Unconditional jump to specified program counter
 *  @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Controls.sol#L52
 **/
export const jump: Opcode<JumpArgs> = new Opcode(Symbol('Controls.jump'), JumpArgs.CODER)

export const jumpIfTokenIn: Opcode<JumpIfTokenArgs> = new Opcode(
  Symbol('Controls.jumpIfTokenIn'),
  JumpIfTokenArgs.CODER,
)

export const jumpIfTokenOut: Opcode<JumpIfTokenArgs> = new Opcode(
  Symbol('Controls.jumpIfTokenOut'),
  JumpIfTokenArgs.CODER,
)

export const deadline: Opcode<DeadlineArgs> = new Opcode(
  Symbol('Controls.deadline'),
  DeadlineArgs.CODER,
)
/**
 * Requires taker to hold any amount of specified token (supports NFTs)
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Controls.sol#L77
 **/
export const onlyTakerTokenBalanceNonZero: Opcode<OnlyTakerTokenBalanceNonZeroArgs> = new Opcode(
  Symbol('Controls.onlyTakerTokenBalanceNonZero'),
  OnlyTakerTokenBalanceNonZeroArgs.CODER,
)

/**
 * Requires taker to hold at least specified amount of token
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Controls.sol#L86
 */
export const onlyTakerTokenBalanceGte: Opcode<OnlyTakerTokenBalanceGteArgs> = new Opcode(
  Symbol('Controls.onlyTakerTokenBalanceGte'),
  OnlyTakerTokenBalanceGteArgs.CODER,
)

/**
 * Requires taker to hold at least specified share of token's total supply
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Controls.sol#L96
 **/
export const onlyTakerTokenSupplyShareGte: Opcode<OnlyTakerTokenSupplyShareGteArgs> = new Opcode(
  Symbol('Controls.onlyTakerTokenSupplyShareGte'),
  OnlyTakerTokenSupplyShareGteArgs.CODER,
)

/**
 * No-op instruction used to add uniqueness to order hashes (prevents replay attacks)
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Controls.sol#L48
 **/
export const salt: Opcode<SaltArgs> = new Opcode(Symbol('Controls.salt'), SaltArgs.CODER)
