// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { FlatFeeArgs } from './flat-fee-args'
import { ProtocolFeeArgs } from './protocol-fee-args'
import { Opcode } from '../opcode'

/**
 * Applies flat fee to computed swap amount (same rate for exactIn and exactOut)
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L66
 **/
export const flatFeeXD = new Opcode(Symbol('Fee.flatFeeXD'), FlatFeeArgs.CODER)

/**
 * Applies fee to amountIn
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L72
 **/
export const flatFeeAmountInXD = new Opcode(Symbol('Fee.flatFeeAmountInXD'), FlatFeeArgs.CODER)

/**
 * Applies fee to amountOut
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L78
 **/
export const flatFeeAmountOutXD = new Opcode(Symbol('Fee.flatFeeAmountOutXD'), FlatFeeArgs.CODER)

/**
 * Applies progressive fee based on price impact
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L84
 **/
export const progressiveFeeXD = new Opcode(Symbol('Fee.progressiveFeeXD'), FlatFeeArgs.CODER)

/**
 * Applies protocol fee to amountOut with direct transfer
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L102
 **/
export const protocolFeeAmountOutXD = new Opcode(
  Symbol('Fee.protocolFeeAmountOutXD'),
  ProtocolFeeArgs.CODER,
)

/**
 * Applies protocol fee to amountOut through Aqua protocol
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L110
 **/
export const aquaProtocolFeeAmountOutXD = new Opcode(
  Symbol('Fee.aquaProtocolFeeAmountOutXD'),
  ProtocolFeeArgs.CODER,
)
