import { BytesBuilder, BytesIter } from '@1inch/byte-utils'
import { AddressHalf, HexString } from '@1inch/sdk-core'
import { ConcentrateGrowLiquidityXDArgs } from './concentrate-grow-liquidity-xd-args'
import type { TokenDelta } from './types'
import type { IArgsCoder } from '../types'

export class ConcentrateGrowLiquidityXDArgsCoder
  implements IArgsCoder<ConcentrateGrowLiquidityXDArgs>
{
  encode(args: ConcentrateGrowLiquidityXDArgs): HexString {
    const builder = new BytesBuilder()

    builder.addUint16(BigInt(args.tokenDeltas.length))

    for (const { tokenHalf } of args.tokenDeltas) {
      builder.addBytes(tokenHalf.toString())
    }

    for (const { delta } of args.tokenDeltas) {
      builder.addUint256(delta)
    }

    return new HexString(builder.asHex())
  }

  decode(data: HexString): ConcentrateGrowLiquidityXDArgs {
    const iter = BytesIter.HexString(data.toString())
    const tokenCount = Number(iter.nextUint16())
    const tokenHalves: AddressHalf[] = []

    for (let i = 0; i < tokenCount; i++) {
      const bytes = iter.nextBytes(10)
      tokenHalves.push(AddressHalf.fromHex(bytes))
    }

    const tokenDeltas: TokenDelta[] = []

    for (let i = 0; i < tokenCount; i++) {
      tokenDeltas.push({
        tokenHalf: tokenHalves[i],
        delta: BigInt(iter.nextUint256()),
      })
    }

    return new ConcentrateGrowLiquidityXDArgs(tokenDeltas)
  }
}
