// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { FlatFeeArgs } from './flat-fee/flat-fee-args'
import { ProtocolFeeArgs } from './protocol-fee/protocol-fee-args'
import { DynamicProtocolFeeArgs } from './dynamic-protocol-fee/dynamic-protocol-fee-args'
import { Opcode } from '../opcode'

/**
 * Applies fee to amountIn
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L72
 **/
export const flatFeeAmountInXD = new Opcode(Symbol('Fee.flatFeeAmountInXD'), FlatFeeArgs.CODER)

/**
 * Protocol fee on amountIn (feeBps + to). Fee transferred from maker to recipient.
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L101
 **/
export const protocolFeeAmountInXD = new Opcode(
  Symbol('Fee.protocolFeeAmountInXD'),
  ProtocolFeeArgs.CODER,
)

/**
 * Protocol fee on amountIn for Aqua (feeBps + to). Pulls from maker's Aqua balance.
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L121
 **/
export const aquaProtocolFeeAmountInXD = new Opcode(
  Symbol('Fee.aquaProtocolFeeAmountInXD'),
  ProtocolFeeArgs.CODER,
)

/**
 * Dynamic protocol fee: args = feeProvider address (20 bytes).
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L148
 **/
export const dynamicProtocolFeeAmountInXD = new Opcode(
  Symbol('Fee.dynamicProtocolFeeAmountInXD'),
  DynamicProtocolFeeArgs.CODER,
)

/**
 * Dynamic protocol fee for Aqua: args = feeProvider address (20 bytes).
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L197
 **/
export const aquaDynamicProtocolFeeAmountInXD = new Opcode(
  Symbol('Fee.aquaDynamicProtocolFeeAmountInXD'),
  DynamicProtocolFeeArgs.CODER,
)

/*  BELOW ARE EXPERIMENTAL OPCODES. DO NOT RECOMMEND TO USE THEM IN PRODUCTION */

/**
 * Applies fee to amountOut
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/FeeExperimental.sol#L40
 **/
export const flatFeeAmountOutXD = new Opcode(
  Symbol('FeeExperimental.flatFeeAmountOutXD'),
  FlatFeeArgs.CODER,
)

/**
 * Applies progressive fee to amountIn
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/FeeExperimental.sol#L46
 **/
export const progressiveFeeInXD = new Opcode(
  Symbol('FeeExperimental.progressiveFeeInXD'),
  FlatFeeArgs.CODER,
)

/**
 * Applies progressive fee to amountOut
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/FeeExperimental.sol#L74
 **/
export const progressiveFeeOutXD = new Opcode(
  Symbol('FeeExperimental.progressiveFeeOutXD'),
  FlatFeeArgs.CODER,
)

/**
 * Protocol fee on amountOut (feeBps + to). Fee transferred from maker to recipient.
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/FeeExperimental.sol#L107
 **/
export const protocolFeeAmountOutXD = new Opcode(
  Symbol('FeeExperimental.protocolFeeAmountOutXD'),
  ProtocolFeeArgs.CODER,
)

/**
 * Protocol fee on amountOut (feeBps + to) for Aqua (feeBps + to). Pulls from maker's Aqua balance.
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/FeeExperimental.sol#L122
 **/
export const aquaProtocolFeeAmountOutXD = new Opcode(
  Symbol('FeeExperimental.aquaProtocolFeeAmountOutXD'),
  ProtocolFeeArgs.CODER,
)
