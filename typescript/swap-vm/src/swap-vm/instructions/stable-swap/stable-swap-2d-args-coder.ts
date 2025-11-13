import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { StableSwap2DArgs } from './stable-swap-2d-args'
import type { IArgsCoder } from '../types'

export class StableSwap2DArgsCoder implements IArgsCoder<StableSwap2DArgs> {
  encode(args: StableSwap2DArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint32(args.fee)
    builder.addUint32(args.A)
    builder.addUint256(args.rateLt)
    builder.addUint256(args.rateGt)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): StableSwap2DArgs {
    const iter = BytesIter.BigInt(data.toString())
    const fee = iter.nextUint32()
    const A = iter.nextUint32()
    const rateLt = iter.nextUint256()
    const rateGt = iter.nextUint256()

    return new StableSwap2DArgs(fee, A, rateLt, rateGt)
  }
}
