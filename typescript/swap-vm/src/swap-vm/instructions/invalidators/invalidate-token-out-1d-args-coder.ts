import { BytesBuilder, BytesIter } from '@1inch/byte-utils'
import { AddressHalf, HexString } from '@1inch/sdk-core'
import { InvalidateTokenOut1DArgs } from './invalidate-token-out-1d-args'
import type { IArgsCoder } from '../types'

export class InvalidateTokenOut1DArgsCoder implements IArgsCoder<InvalidateTokenOut1DArgs> {
  encode(args: InvalidateTokenOut1DArgs): HexString {
    const builder = new BytesBuilder()
    builder.addBytes(args.tokenOutHalf.toString())

    return new HexString(builder.asHex())
  }

  decode(data: HexString): InvalidateTokenOut1DArgs {
    const iter = BytesIter.HexString(data.toString())
    const bytes = iter.nextBytes(10)
    const tokenOutHalf = AddressHalf.fromHex(bytes)

    return new InvalidateTokenOut1DArgs(tokenOutHalf)
  }
}
