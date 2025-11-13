import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { LimitSwapDirectionArgs } from './limit-swap-direction-args'
import type { IArgsCoder } from '../types'

export class LimitSwapDirectionArgsCoder implements IArgsCoder<LimitSwapDirectionArgs> {
  encode(args: LimitSwapDirectionArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint8(args.makerDirectionLt ? 1n : 0n)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): LimitSwapDirectionArgs {
    const iter = BytesIter.BigInt(data.toString())

    const makerDirectionLt = iter.nextUint8() !== 0n

    return new LimitSwapDirectionArgs(makerDirectionLt)
  }
}
