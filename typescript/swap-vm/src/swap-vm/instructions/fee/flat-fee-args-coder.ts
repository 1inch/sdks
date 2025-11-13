import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { FlatFeeArgs } from './flat-fee-args'
import type { IArgsCoder } from '../types'

export class FlatFeeArgsCoder implements IArgsCoder<FlatFeeArgs> {
  encode(args: FlatFeeArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint32(args.fee)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): FlatFeeArgs {
    const iter = BytesIter.BigInt(data.toString())
    const fee = iter.nextUint32()

    return new FlatFeeArgs(fee)
  }
}
