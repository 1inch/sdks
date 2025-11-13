import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { MinRateArgs } from './min-rate-args'
import type { IArgsCoder } from '../types'

export class MinRateArgsCoder implements IArgsCoder<MinRateArgs> {
  encode(args: MinRateArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint64(args.rateLt)
    builder.addUint64(args.rateGt)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): MinRateArgs {
    const iter = BytesIter.BigInt(data.toString())
    const rateLt = iter.nextUint64()
    const rateGt = iter.nextUint64()

    return new MinRateArgs(rateLt, rateGt)
  }
}
