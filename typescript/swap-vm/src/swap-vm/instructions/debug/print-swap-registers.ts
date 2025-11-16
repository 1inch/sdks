// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { HexString } from '@1inch/sdk-core'
import { DebugArgs } from './debug-args'
import type { IArgsCoder } from '../types'

class PrintSwapRegistersArgsCoder implements IArgsCoder<PrintSwapRegistersArgs> {
  encode(_args: PrintSwapRegistersArgs): HexString {
    return HexString.EMPTY
  }

  decode(_data: HexString): PrintSwapRegistersArgs {
    return new PrintSwapRegistersArgs()
  }
}

/**
 * Debug instruction to print swap registers
 * @see Debug._printSwapRegisters in Solidity
 */
export class PrintSwapRegistersArgs extends DebugArgs {
  public static readonly CODER = new PrintSwapRegistersArgsCoder()

  static decode(_data: HexString): PrintSwapRegistersArgs {
    return PrintSwapRegistersArgs.CODER.decode(_data)
  }
}
