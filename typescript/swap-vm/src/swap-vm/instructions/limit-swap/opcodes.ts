// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { LimitSwapDirectionArgs } from './limit-swap-direction-args'
import { Opcode } from '../opcode'

/**
 * Limit order swap with proportional execution
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/LimitSwap.sol#L27
 **/
export const limitSwap1D = new Opcode(Symbol('LimitSwap.limitSwap1D'), LimitSwapDirectionArgs.CODER)

/**
 * Limit order swap requiring full amount execution
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/LimitSwap.sol#L44
 **/
export const limitSwapOnlyFull1D = new Opcode(
  Symbol('LimitSwap.limitSwapOnlyFull1D'),
  LimitSwapDirectionArgs.CODER,
)
