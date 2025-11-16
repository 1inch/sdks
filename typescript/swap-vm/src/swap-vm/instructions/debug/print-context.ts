// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { HexString } from '@1inch/sdk-core'
import { DebugArgs } from './debug-args'
import type { IArgsCoder } from '../types'

class PrintContextArgsCoder implements IArgsCoder<PrintContextArgs> {
  encode(_args: PrintContextArgs): HexString {
    return HexString.EMPTY
  }

  decode(_data: HexString): PrintContextArgs {
    return new PrintContextArgs()
  }
}

/**
 * Debug instruction to print execution context
 * @see Debug._printContext in Solidity
 */
export class PrintContextArgs extends DebugArgs {
  public static readonly CODER = new PrintContextArgsCoder()

  static decode(_data: HexString): PrintContextArgs {
    return PrintContextArgs.CODER.decode(_data)
  }
}
