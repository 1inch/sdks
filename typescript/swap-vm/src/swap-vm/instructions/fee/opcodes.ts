// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { FlatFeeArgs } from './flat-fee-args'
import { ProtocolFeeArgs } from './protocol-fee-args'
import { Opcode } from '../opcode'

/**
 * Applies fee to amountIn
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L66
 **/
export const flatFeeAmountInXD = new Opcode(Symbol('Fee.flatFeeAmountInXD'), FlatFeeArgs.CODER)

/**
 * Applies fee to amountOut
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L72
 **/
export const flatFeeAmountOutXD = new Opcode(Symbol('Fee.flatFeeAmountOutXD'), FlatFeeArgs.CODER)

/**
 * Applies progressive fee to amountIn
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L78
 **/
export const progressiveFeeInXD = new Opcode(Symbol('Fee.progressiveFeeInXD'), FlatFeeArgs.CODER)

/**
 * Applies progressive fee to amountOut
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L106
 **/
export const progressiveFeeOutXD = new Opcode(Symbol('Fee.progressiveFeeOutXD'), FlatFeeArgs.CODER)

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
