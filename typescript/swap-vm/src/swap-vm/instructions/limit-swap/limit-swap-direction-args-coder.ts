// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import assert from 'assert'
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
    const direction = iter.nextUint8()

    assert(
      direction === 0n || direction === 1n,
      `Invalid makerDirectionLt byte: 0x${direction.toString(16).padStart(2, '0')}. Must be 0x00 or 0x01`,
    )

    return new LimitSwapDirectionArgs(direction === 1n)
  }
}
