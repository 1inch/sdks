// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { HexString } from '@1inch/sdk-core'
import { DebugArgs } from './debug-args'
import type { IArgsCoder } from '../types'

class PrintSwapQueryArgsCoder implements IArgsCoder<PrintSwapQueryArgs> {
  encode(_args: PrintSwapQueryArgs): HexString {
    return HexString.EMPTY
  }

  decode(_data: HexString): PrintSwapQueryArgs {
    return new PrintSwapQueryArgs()
  }
}

/**
 * Debug instruction to print swap query information
 * @see Debug._printSwapQuery in Solidity
 */
export class PrintSwapQueryArgs extends DebugArgs {
  public static readonly CODER = new PrintSwapQueryArgsCoder()

  static decode(_data: HexString): PrintSwapQueryArgs {
    return PrintSwapQueryArgs.CODER.decode(_data)
  }
}
