// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address, HexString } from '@1inch/sdk-core'
import assert from 'node:assert'
import { OnlyTakerTokenBalanceGteArgsCoder } from './only-taker-token-balance-gte-args-coder'
import type { IArgsData } from '../types'

/**
 * Arguments for checking if taker holds at least specified amount of token
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Controls.sol#L10
 **/
export class OnlyTakerTokenBalanceGteArgs implements IArgsData {
  public static readonly CODER = new OnlyTakerTokenBalanceGteArgsCoder()

  constructor(
    public readonly token: Address,
    public readonly minAmount: bigint,
  ) {
    assert(minAmount >= 0n, 'minAmount must be non-negative')
  }

  /**
   * Decodes hex data into OnlyTakerTokenBalanceGteArgs instance
   **/
  static decode(data: HexString): OnlyTakerTokenBalanceGteArgs {
    return OnlyTakerTokenBalanceGteArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      token: this.token.toString(),
      minAmount: this.minAmount.toString(),
    }
  }
}
