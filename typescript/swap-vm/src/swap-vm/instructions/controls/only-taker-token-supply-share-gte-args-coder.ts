import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { Address, HexString } from '@1inch/sdk-core'
import { OnlyTakerTokenSupplyShareGteArgs } from './only-taker-token-supply-share-gte-args'
import type { IArgsCoder } from '../types'

export class OnlyTakerTokenSupplyShareGteArgsCoder
  implements IArgsCoder<OnlyTakerTokenSupplyShareGteArgs>
{
  encode(args: OnlyTakerTokenSupplyShareGteArgs): HexString {
    const builder = new BytesBuilder()

    builder.addAddress(args.token.toString())
    builder.addUint64(args.minShareE18)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): OnlyTakerTokenSupplyShareGteArgs {
    const iter = BytesIter.HexString(data.toString())
    const token = new Address(iter.nextUint160())

    // Read 8 bytes for uint64
    const bytes = iter.nextBytes(8)
    const minShareE18 = BigInt(add0x(bytes))

    return new OnlyTakerTokenSupplyShareGteArgs(token, minShareE18)
  }
}
