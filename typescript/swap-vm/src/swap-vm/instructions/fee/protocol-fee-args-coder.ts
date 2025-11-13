import { BytesBuilder, BytesIter } from '@1inch/byte-utils'
import { Address, HexString } from '@1inch/sdk-core'
import { ProtocolFeeArgs } from './protocol-fee-args'
import type { IArgsCoder } from '../types'

export class ProtocolFeeArgsCoder implements IArgsCoder<ProtocolFeeArgs> {
  encode(args: ProtocolFeeArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint32(args.fee)
    builder.addAddress(args.to.toString())

    return new HexString(builder.asHex())
  }

  decode(data: HexString): ProtocolFeeArgs {
    const iter = BytesIter.HexString(data.toString())
    const fee = iter.nextUint32()
    const to = new Address(iter.nextAddress())

    return new ProtocolFeeArgs(BigInt(fee), to)
  }
}
