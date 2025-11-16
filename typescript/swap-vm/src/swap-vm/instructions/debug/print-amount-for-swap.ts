// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { HexString } from '@1inch/sdk-core'
import { DebugArgs } from './debug-args'
import type { IArgsCoder } from '../types'

class PrintAmountForSwapArgsCoder implements IArgsCoder<PrintAmountForSwapArgs> {
  encode(_args: PrintAmountForSwapArgs): HexString {
    return HexString.EMPTY
  }

  decode(_data: HexString): PrintAmountForSwapArgs {
    return new PrintAmountForSwapArgs()
  }
}

/**
 * Debug instruction to print amount for swap
 * @see Debug._printAmountForSwap in Solidity
 */
export class PrintAmountForSwapArgs extends DebugArgs {
  public static readonly CODER = new PrintAmountForSwapArgsCoder()

  static decode(_data: HexString): PrintAmountForSwapArgs {
    return PrintAmountForSwapArgs.CODER.decode(_data)
  }
}
