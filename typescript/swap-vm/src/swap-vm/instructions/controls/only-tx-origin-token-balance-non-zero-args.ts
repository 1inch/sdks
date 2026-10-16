// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address, HexString } from '@1inch/sdk-core'
import { OnlyTxOriginTokenBalanceNonZeroArgsCoder } from './only-tx-origin-token-balance-non-zero-args-coder'
import type { IArgsCoder, IArgsData } from '../types'

/**
 * Arguments for checking if tx.origin holds any amount of a token
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Controls.sol#L10
 **/
export class OnlyTxOriginTokenBalanceNonZeroArgs implements IArgsData {
  public static readonly CODER: IArgsCoder<OnlyTxOriginTokenBalanceNonZeroArgs> =
    new OnlyTxOriginTokenBalanceNonZeroArgsCoder()

  constructor(public readonly token: Address) {}

  /**
   * Decodes hex data into OnlyTxOriginTokenBalanceNonZeroArgs instance
   **/
  static decode(data: HexString): OnlyTxOriginTokenBalanceNonZeroArgs {
    return OnlyTxOriginTokenBalanceNonZeroArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      token: this.token.toString(),
    }
  }
}
