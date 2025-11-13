import { BytesBuilder, BytesIter } from '@1inch/byte-utils'
import { AddressHalf, HexString } from '@1inch/sdk-core'
import { InvalidateTokenIn1DArgs } from './invalidate-token-in-1d-args'
import type { IArgsCoder } from '../types'

export class InvalidateTokenIn1DArgsCoder implements IArgsCoder<InvalidateTokenIn1DArgs> {
  encode(args: InvalidateTokenIn1DArgs): HexString {
    const builder = new BytesBuilder()
    builder.addBytes(args.tokenInHalf.toString())

    return new HexString(builder.asHex())
  }

  decode(data: HexString): InvalidateTokenIn1DArgs {
    const iter = BytesIter.HexString(data.toString())
    const bytes = iter.nextBytes(10)
    const tokenInHalf = AddressHalf.fromHex(bytes)

    return new InvalidateTokenIn1DArgs(tokenInHalf)
  }
}
