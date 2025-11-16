// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { DutchAuctionArgs } from './dutch-auction-args'
import type { IArgsCoder } from '../types'

export class DutchAuctionArgsCoder implements IArgsCoder<DutchAuctionArgs> {
  encode(args: DutchAuctionArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint40(args.startTime)
    builder.addUint16(args.duration)
    builder.addUint32(args.decayFactor)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): DutchAuctionArgs {
    const iter = BytesIter.BigInt(data.toString())
    const startTime = iter.nextUint40()
    const duration = iter.nextUint16()
    const decayFactor = iter.nextUint32()

    return new DutchAuctionArgs(startTime, duration, decayFactor)
  }
}
