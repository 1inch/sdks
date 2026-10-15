// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { ProgressiveFeeArgs } from './progressive-fee-args'
import type { IArgsCoder } from '../../types'

export class ProgressiveFeeArgsCoder implements IArgsCoder<ProgressiveFeeArgs> {
  encode(args: ProgressiveFeeArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint32(args.fee)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): ProgressiveFeeArgs {
    const iter = BytesIter.BigInt(data.toString())
    const fee = iter.nextUint32()

    return new ProgressiveFeeArgs(fee)
  }
}
