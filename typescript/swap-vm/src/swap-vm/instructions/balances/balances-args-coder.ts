// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { Address, HexString } from '@1inch/sdk-core'
import { BytesBuilder, BytesIter } from '@1inch/byte-utils'
import { BalancesArgs } from './balances-args'
import type { TokenBalance } from './types'
import type { IArgsCoder } from '../types'

export class BalancesArgsCoder implements IArgsCoder<BalancesArgs> {
  encode(args: BalancesArgs): HexString {
    const builder = new BytesBuilder()

    builder.addUint16(BigInt(args.tokenBalances.length))

    for (const { token } of args.tokenBalances) {
      builder.addAddress(token.toString())
    }

    for (const { value } of args.tokenBalances) {
      builder.addUint256(value)
    }

    return new HexString(builder.asHex())
  }

  decode(data: HexString): BalancesArgs {
    const iter = BytesIter.HexString(data.toString())
    const tokenCount = Number(iter.nextUint16())
    const tokens: Address[] = []

    for (let i = 0; i < tokenCount; i++) {
      tokens.push(new Address(iter.nextAddress()))
    }

    const tokenBalances: TokenBalance[] = []

    for (let i = 0; i < tokenCount; i++) {
      tokenBalances.push({
        token: tokens[i],
        value: BigInt(iter.nextUint256()),
      })
    }

    return new BalancesArgs(tokenBalances)
  }
}
