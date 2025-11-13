import { BytesBuilder, BytesIter } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { DecayXDArgs } from './decay-xd-args'
import type { IArgsCoder } from '../types'

export class DecayXDArgsCoder implements IArgsCoder<DecayXDArgs> {
  encode(args: DecayXDArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint16(args.decayPeriod)

    return new HexString(builder.asHex())
  }

  decode(data: HexString): DecayXDArgs {
    const iter = BytesIter.BigInt(data.toString())
    const decayPeriod = iter.nextUint16()

    return new DecayXDArgs(decayPeriod)
  }
}
