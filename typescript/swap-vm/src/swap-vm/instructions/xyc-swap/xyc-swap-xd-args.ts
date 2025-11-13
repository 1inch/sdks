import type { HexString } from '@1inch/sdk-core'
import { XycSwapXDArgsCoder } from './xyc-swap-xd-args-coder'
import type { IArgsData } from '../types'

/**
 * Arguments for xycSwapXD instruction (no arguments required)
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/XYCSwap.sol#L15
 **/
export class XycSwapXDArgs implements IArgsData {
  public static readonly CODER = new XycSwapXDArgsCoder()

  constructor() {}

  /**
   * Decodes hex data into XycSwapXDArgs instance
   **/
  static decode(data: HexString): XycSwapXDArgs {
    return XycSwapXDArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {}
  }
}
