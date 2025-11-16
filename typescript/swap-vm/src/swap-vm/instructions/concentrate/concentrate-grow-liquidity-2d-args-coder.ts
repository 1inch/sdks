// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BytesBuilder, BytesIter } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { ConcentrateGrowLiquidity2DArgs } from './concentrate-grow-liquidity-2d-args'
import type { IArgsCoder } from '../types'

export class ConcentrateGrowLiquidity2DArgsCoder
  implements IArgsCoder<ConcentrateGrowLiquidity2DArgs>
{
  encode(args: ConcentrateGrowLiquidity2DArgs): HexString {
    const builder = new BytesBuilder()

    builder.addUint256(args.deltaLt)
    builder.addUint256(args.deltaGt)

    return new HexString(builder.asHex())
  }

  decode(data: HexString): ConcentrateGrowLiquidity2DArgs {
    const iter = BytesIter.BigInt(data.toString())
    const deltaLt = iter.nextUint256()
    const deltaGt = iter.nextUint256()

    return new ConcentrateGrowLiquidity2DArgs(deltaLt, deltaGt)
  }
}
