import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { Address, HexString } from '@1inch/sdk-core'
import { OnlyTakerTokenBalanceNonZeroArgs } from './only-taker-token-balance-non-zero-args'
import type { IArgsCoder } from '../types'

export class OnlyTakerTokenBalanceNonZeroArgsCoder
  implements IArgsCoder<OnlyTakerTokenBalanceNonZeroArgs>
{
  encode(args: OnlyTakerTokenBalanceNonZeroArgs): HexString {
    const builder = new BytesBuilder()
    builder.addAddress(args.token.toString())

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): OnlyTakerTokenBalanceNonZeroArgs {
    const iter = BytesIter.HexString(data.toString())
    const token = new Address(iter.nextUint160())

    return new OnlyTakerTokenBalanceNonZeroArgs(token)
  }
}
