// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BytesBuilder, BytesIter } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { PeggedSwapArgs } from './pegged-swap-args'
import type { IArgsCoder } from '../types'

export class PeggedSwapArgsCoder implements IArgsCoder<PeggedSwapArgs> {
  encode(args: PeggedSwapArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint256(args.x0)
    builder.addUint256(args.y0)
    builder.addUint256(args.linearWidth)
    builder.addUint256(args.rateLt)
    builder.addUint256(args.rateGt)

    return new HexString(builder.asHex())
  }

  decode(data: HexString): PeggedSwapArgs {
    const iter = BytesIter.BigInt(data.toString())
    const x0 = BigInt(iter.nextUint256())
    const y0 = BigInt(iter.nextUint256())
    const linearWidth = BigInt(iter.nextUint256())
    const rateLt = BigInt(iter.nextUint256())
    const rateGt = BigInt(iter.nextUint256())

    return new PeggedSwapArgs(x0, y0, linearWidth, rateLt, rateGt)
  }
}
