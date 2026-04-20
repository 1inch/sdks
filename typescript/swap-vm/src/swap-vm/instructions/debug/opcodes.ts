// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { DebugEmptyArgs } from './debug-empty-args'
import { PrintSwapRegistersArgs } from './print-swap-registers'
import { PrintSwapQueryArgs } from './print-swap-query'
import { PrintContextArgs } from './print-context'
import { PrintAmountForSwapArgs } from './print-amount-for-swap'
import { PrintFreeMemoryPointerArgs } from './print-free-memory-pointer'
import { PrintGasLeftArgs } from './print-gas-left'
import { Opcode } from '../opcode'

export {
  DebugEmptyArgs,
  PrintSwapRegistersArgs,
  PrintSwapQueryArgs,
  PrintContextArgs,
  PrintAmountForSwapArgs,
  PrintFreeMemoryPointerArgs,
  PrintGasLeftArgs,
}

/**
 * Debug empty opcode - placeholder
 */
export const debugEmpty: Opcode<DebugEmptyArgs> = new Opcode(
  Symbol('Debug.Empty'),
  DebugEmptyArgs.CODER,
)

export const printSwapRegisters: Opcode<PrintSwapRegistersArgs> = new Opcode(
  Symbol('Debug.printSwapRegisters'),
  PrintSwapRegistersArgs.CODER,
)

export const printSwapQuery: Opcode<PrintSwapQueryArgs> = new Opcode(
  Symbol('Debug.printSwapQuery'),
  PrintSwapQueryArgs.CODER,
)

export const printContext: Opcode<PrintContextArgs> = new Opcode(
  Symbol('Debug.printContext'),
  PrintContextArgs.CODER,
)

export const printAmountForSwap: Opcode<PrintAmountForSwapArgs> = new Opcode(
  Symbol('debug.printAmountForSwap'),
  PrintAmountForSwapArgs.CODER,
)

export const printFreeMemoryPointer: Opcode<PrintFreeMemoryPointerArgs> = new Opcode(
  Symbol('Debug.printFreeMemoryPointer'),
  PrintFreeMemoryPointerArgs.CODER,
)

export const printGasLeft: Opcode<PrintGasLeftArgs> = new Opcode(
  Symbol('Debug.printGasLeft'),
  PrintGasLeftArgs.CODER,
)
