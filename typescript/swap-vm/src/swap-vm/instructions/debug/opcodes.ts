import { DebugEmptyArgs } from './debug-empty-args'
import { PrintSwapRegistersArgs } from './print-swap-registers'
import { PrintSwapQueryArgs } from './print-swap-query'
import { PrintContextArgs } from './print-context'
import { PrintAmountForSwapArgs } from './print-amount-for-swap'
import { PrintFreeMemoryPointerArgs } from './print-free-memory-pointer'
import { PrintGasLeftArgs } from './print-gas-left'
import { Opcode } from '../opcode'

/**
 * Debug empty opcode - placeholder
 */
export const debugEmpty = new Opcode(Symbol('debug-empty'), DebugEmptyArgs.CODER)

export const printSwapRegisters = new Opcode(
  Symbol('debug.printSwapRegisters'),
  PrintSwapRegistersArgs.CODER,
)

export const printSwapQuery = new Opcode(Symbol('debug.printSwapQuery'), PrintSwapQueryArgs.CODER)

export const printContext = new Opcode(Symbol('debug.printContext'), PrintContextArgs.CODER)

export const printAmountForSwap = new Opcode(
  Symbol('debug.printAmountForSwap'),
  PrintAmountForSwapArgs.CODER,
)

export const printFreeMemoryPointer = new Opcode(
  Symbol('debug.printFreeMemoryPointer'),
  PrintFreeMemoryPointerArgs.CODER,
)

export const printGasLeft = new Opcode(Symbol('debug.printGasLeft'), PrintGasLeftArgs.CODER)
