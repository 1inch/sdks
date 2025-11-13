import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { Address, HexString } from '@1inch/sdk-core'
import { OnlyTakerTokenBalanceGteArgs } from './only-taker-token-balance-gte-args'
import type { IArgsCoder } from '../types'

export class OnlyTakerTokenBalanceGteArgsCoder implements IArgsCoder<OnlyTakerTokenBalanceGteArgs> {
  encode(args: OnlyTakerTokenBalanceGteArgs): HexString {
    const builder = new BytesBuilder()

    builder.addAddress(args.token.toString())
    builder.addUint256(args.minAmount)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): OnlyTakerTokenBalanceGteArgs {
    const iter = BytesIter.HexString(data.toString())
    const token = new Address(iter.nextUint160())
    const minAmount = BigInt(iter.nextUint256())

    return new OnlyTakerTokenBalanceGteArgs(token, minAmount)
  }
}
