// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address, HexString } from '@1inch/sdk-core'
import { LimitSwapDirectionArgsCoder } from './limit-swap-direction-args-coder'
import type { IArgsData } from '../types'

/**
 * Arguments for limit swap instructions (limitSwap1D, limitSwapOnlyFull1D)
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/LimitSwap.sol#L27
 **/
export class LimitSwapDirectionArgs implements IArgsData {
  public static readonly CODER = new LimitSwapDirectionArgsCoder()

  constructor(
    /**
     * true if tokenIn < tokenOut
     **/
    public readonly makerDirectionLt: boolean, // true if tokenIn < tokenOut
  ) {}

  static fromTokens(tokenIn: Address, tokenOut: Address): LimitSwapDirectionArgs {
    return new LimitSwapDirectionArgs(BigInt(tokenIn.toString()) < BigInt(tokenOut.toString()))
  }

  /**
   * Decodes hex data into LimitSwapDirectionArgs instance
   **/
  static decode(data: HexString): LimitSwapDirectionArgs {
    return LimitSwapDirectionArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      makerDirectionLt: this.makerDirectionLt,
    }
  }
}
