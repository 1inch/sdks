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
 * Arguments of the `printAmountForSwap` debug opcode
 * @deprecated The SwapVM `Debug` contract has no printAmountForSwap instruction, so no router
 * can execute this opcode
 */
export class PrintAmountForSwapArgs extends DebugArgs {
  public static readonly CODER: IArgsCoder<PrintAmountForSwapArgs> =
    new PrintAmountForSwapArgsCoder()

  static decode(_data: HexString): PrintAmountForSwapArgs {
    return PrintAmountForSwapArgs.CODER.decode(_data)
  }
}
