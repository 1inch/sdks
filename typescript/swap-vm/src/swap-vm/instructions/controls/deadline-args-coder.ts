// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { DeadlineArgs } from './deadline-args'
import type { IArgsCoder } from '../types'

export class DeadlineArgsCoder implements IArgsCoder<DeadlineArgs> {
  encode(args: DeadlineArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint40(args.deadline)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): DeadlineArgs {
    const iter = BytesIter.BigInt(data.toString())
    const deadline = iter.nextUint40()

    return new DeadlineArgs(deadline)
  }
}
