// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString } from '@1inch/sdk-core'
import type { TokenBalance } from './types'
import { BalancesArgsCoder } from './balances-args-coder'
import type { IArgsData } from '../types'

/**
 * Arguments for setBalances and balances instructions containing token-amount pairs
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Balances.sol#L10
 **/
export class BalancesArgs implements IArgsData {
  public static readonly CODER = new BalancesArgsCoder()

  constructor(public readonly tokenBalances: TokenBalance[]) {}

  /**
   *  Decodes hex data into BalancesArgs instance
   **/
  static decode(data: HexString): BalancesArgs {
    return BalancesArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      tokenBalances: this.tokenBalances.map(({ tokenHalf, value }) => ({
        token: tokenHalf.toString(),
        value: value.toString(),
      })),
    }
  }
}
