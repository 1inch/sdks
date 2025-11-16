// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { HexString } from '@1inch/sdk-core'
import { DebugArgs } from './debug-args'
import type { IArgsCoder } from '../types'

class PrintGasLeftArgsCoder implements IArgsCoder<PrintGasLeftArgs> {
  encode(_args: PrintGasLeftArgs): HexString {
    return HexString.EMPTY
  }

  decode(_data: HexString): PrintGasLeftArgs {
    return new PrintGasLeftArgs()
  }
}

/**
 * Debug instruction to print remaining gas
 * @see Debug._printGasLeft in Solidity
 */
export class PrintGasLeftArgs extends DebugArgs {
  public static readonly CODER = new PrintGasLeftArgsCoder()

  static decode(_data: HexString): PrintGasLeftArgs {
    return PrintGasLeftArgs.CODER.decode(_data)
  }
}
