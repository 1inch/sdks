// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { AddressHalf, HexString } from '@1inch/sdk-core'
import { add0x, BytesBuilder, BytesIter } from '@1inch/byte-utils'
import { BalancesArgs } from './balances-args'
import type { TokenBalance } from './types'
import type { IArgsCoder } from '../types'

export class BalancesArgsCoder implements IArgsCoder<BalancesArgs> {
  encode(args: BalancesArgs): HexString {
    const builder = new BytesBuilder()

    builder.addUint16(BigInt(args.tokenBalances.length))

    for (const { tokenHalf } of args.tokenBalances) {
      builder.addBytes(tokenHalf.toString())
    }

    for (const { value } of args.tokenBalances) {
      builder.addUint256(value)
    }

    return new HexString(builder.asHex())
  }

  decode(data: HexString): BalancesArgs {
    const iter = BytesIter.HexString(data.toString())
    const tokenCount = Number(iter.nextUint16())
    const tokenHalfs: AddressHalf[] = []

    for (let i = 0; i < tokenCount; i++) {
      const bytes = iter.nextBytes(10)

      const hexString = add0x(bytes)
      tokenHalfs.push(AddressHalf.fromHex(hexString))
    }

    const tokenBalances: TokenBalance[] = []

    for (let i = 0; i < tokenCount; i++) {
      tokenBalances.push({
        tokenHalf: tokenHalfs[i],
        value: BigInt(iter.nextUint256()),
      })
    }

    return new BalancesArgs(tokenBalances)
  }
}
