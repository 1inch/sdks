import { HexString } from '@1inch/sdk-core'
import { DebugArgs } from './debug-args'
import type { IArgsCoder } from '../types'

class PrintFreeMemoryPointerArgsCoder implements IArgsCoder<PrintFreeMemoryPointerArgs> {
  encode(_args: PrintFreeMemoryPointerArgs): HexString {
    return HexString.EMPTY
  }

  decode(_data: HexString): PrintFreeMemoryPointerArgs {
    return new PrintFreeMemoryPointerArgs()
  }
}

/**
 * Debug instruction to print free memory pointer
 * @see Debug._printFreeMemoryPointer in Solidity
 */
export class PrintFreeMemoryPointerArgs extends DebugArgs {
  public static readonly CODER = new PrintFreeMemoryPointerArgsCoder()

  static decode(_data: HexString): PrintFreeMemoryPointerArgs {
    return PrintFreeMemoryPointerArgs.CODER.decode(_data)
  }
}
