// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { InvalidateBit1DArgs } from './invalidate-bit-1d-args'
import { InvalidateTokenIn1DArgs } from './invalidate-token-in-1d-args'
import { InvalidateTokenOut1DArgs } from './invalidate-token-out-1d-args'
import { Opcode } from '../opcode'

/**
 * Invalidates a specific bit index for order uniqueness
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Invalidators.sol#L75
 **/
export const invalidateBit1D = new Opcode(
  Symbol('Invalidators.invalidateBit1D'),
  InvalidateBit1DArgs.CODER,
)

/**
 * Invalidates order by token input to prevent re-use
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Invalidators.sol#L85
 **/
export const invalidateTokenIn1D = new Opcode(
  Symbol('Invalidators.invalidateTokenIn1D'),
  InvalidateTokenIn1DArgs.CODER,
)

/**
 * Invalidates order by token output to prevent re-use
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Invalidators.sol#L103
 **/
export const invalidateTokenOut1D = new Opcode(
  Symbol('Invalidators.invalidateTokenOut1D'),
  InvalidateTokenOut1DArgs.CODER,
)
