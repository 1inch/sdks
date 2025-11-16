// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { SaltArgs } from './salt-args'
import type { IArgsCoder } from '../types'

export class SaltArgsCoder implements IArgsCoder<SaltArgs> {
  encode(args: SaltArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint64(args.salt)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): SaltArgs {
    const iter = BytesIter.BigInt(data.toString())
    const bytes = iter.nextUint64()

    return new SaltArgs(bytes)
  }
}
