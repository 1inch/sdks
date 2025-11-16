// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BalancesArgs } from './balances-args'
import { Opcode } from '../opcode'

/**
 * Sets initial token balances for the swap program
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Balances.sol#L59
 **/
export const staticBalancesXD: Opcode<BalancesArgs> = new Opcode(
  Symbol('Balances.staticBalancesXD'),
  BalancesArgs.CODER,
)

/**
 * Reads token balances from program data or contract storage
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Balances.sol#L89
 **/
export const dynamicBalancesXD: Opcode<BalancesArgs> = new Opcode(
  Symbol('Balances.dynamicBalancesXD'),
  BalancesArgs.CODER,
)
