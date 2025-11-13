import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { InvalidateBit1DArgs } from './invalidate-bit-1d-args'
import type { IArgsCoder } from '../types'

export class InvalidateBit1DArgsCoder implements IArgsCoder<InvalidateBit1DArgs> {
  encode(args: InvalidateBit1DArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint32(args.bitIndex)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): InvalidateBit1DArgs {
    const iter = BytesIter.BigInt(data.toString())
    const bitIndex = iter.nextUint32()

    return new InvalidateBit1DArgs(bitIndex)
  }
}
