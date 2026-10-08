// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString } from '@1inch/sdk-core'
import type { TokenBalance } from './types'
import { BalancesArgsCoder } from './balances-args-coder'
import type { IArgsCoder, IArgsData } from '../types'

/**
 * Arguments for staticBalancesXD and dynamicBalancesXD instructions containing token-amount pairs.
 * Encoded as `uint16 count | count x 20-byte token address | count x uint256 balance`
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Balances.sol#L10
 **/
export class BalancesArgs implements IArgsData {
  public static readonly CODER: IArgsCoder<BalancesArgs> = new BalancesArgsCoder()

  constructor(public readonly tokenBalances: TokenBalance[]) {}

  /**
   *  Decodes hex data into BalancesArgs instance
   **/
  static decode(data: HexString): BalancesArgs {
    return BalancesArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      tokenBalances: this.tokenBalances.map(({ token, value }) => ({
        token: token.toString(),
        value: value.toString(),
      })),
    }
  }
}
