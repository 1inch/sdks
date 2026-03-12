// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { FlatFeeArgs } from './flat-fee/flat-fee-args'
import { ProtocolFeeArgs } from './protocol-fee/protocol-fee-args'
import { DynamicProtocolFeeArgs } from './dynamic-protocol-fee/dynamic-protocol-fee-args'
import { Opcode } from '../opcode'

/**
 * Applies fee to amountIn
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L66
 **/
export const flatFeeAmountInXD = new Opcode(Symbol('Fee.flatFeeAmountInXD'), FlatFeeArgs.CODER)

/**
 * Protocol fee on amountIn (feeBps + to). Fee transferred from maker to recipient.
 * Main branch: Fee._protocolFeeAmountInXD
 **/
export const protocolFeeAmountInXD = new Opcode(
  Symbol('Fee.protocolFeeAmountInXD'),
  ProtocolFeeArgs.CODER,
)

/**
 * Protocol fee on amountIn for Aqua (feeBps + to). Pulls from maker's Aqua balance.
 * Main branch: Fee._aquaProtocolFeeAmountInXD
 **/
export const aquaProtocolFeeAmountInXD = new Opcode(
  Symbol('Fee.aquaProtocolFeeAmountInXD'),
  ProtocolFeeArgs.CODER,
)

/**
 * Dynamic protocol fee: args = feeProvider address (20 bytes).
 * Main branch: Fee._dynamicProtocolFeeAmountInXD, buildDynamicProtocolFee(address)
 **/
export const dynamicProtocolFeeAmountInXD = new Opcode(
  Symbol('Fee.dynamicProtocolFeeAmountInXD'),
  DynamicProtocolFeeArgs.CODER,
)

/**
 * Dynamic protocol fee for Aqua: args = feeProvider address (20 bytes).
 * Main branch: Fee._aquaDynamicProtocolFeeAmountInXD
 **/
export const aquaDynamicProtocolFeeAmountInXD = new Opcode(
  Symbol('Fee.aquaDynamicProtocolFeeAmountInXD'),
  DynamicProtocolFeeArgs.CODER,
)
