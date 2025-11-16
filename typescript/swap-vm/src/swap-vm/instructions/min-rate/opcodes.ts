// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { MinRateArgs } from './min-rate-args'
import { Opcode } from '../opcode'

/**
 * Enforces minimum exchange rate or reverts
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/MinRate.sol#L36
 **/
export const requireMinRate1D = new Opcode(Symbol('MinRate.requireMinRate1D'), MinRateArgs.CODER)

/**
 * Adjusts swap amounts to meet minimum rate if needed
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/MinRate.sol#L50
 **/
export const adjustMinRate1D = new Opcode(Symbol('MinRate.adjustMinRate1D'), MinRateArgs.CODER)
