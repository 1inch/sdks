// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { HexString } from '@1inch/sdk-core'
import type { IArgsData, IArgsCoder } from '../types'

class DebugEmptyArgsCoder implements IArgsCoder<DebugEmptyArgs> {
  encode(_args: DebugEmptyArgs): HexString {
    return HexString.EMPTY
  }

  decode(_data: HexString): DebugEmptyArgs {
    return new DebugEmptyArgs()
  }
}

/**
 * Debug empty instruction arguments - used for debugging purposes
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Debug.sol
 **/
export class DebugEmptyArgs implements IArgsData {
  public static readonly CODER = new DebugEmptyArgsCoder()

  /**
   * Decodes hex data into DebugEmptyArgs instance
   **/
  static decode(_data: HexString): DebugEmptyArgs {
    return DebugEmptyArgs.CODER.decode(_data)
  }

  toJSON(): null {
    return null
  }
}
