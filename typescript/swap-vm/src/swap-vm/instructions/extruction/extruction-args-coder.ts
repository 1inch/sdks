// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BytesBuilder, BytesIter } from '@1inch/byte-utils'
import { Address, HexString } from '@1inch/sdk-core'
import { ExtructionArgs } from './extruction-args'
import type { IArgsCoder } from '../types'

export class ExtructionArgsCoder implements IArgsCoder<ExtructionArgs> {
  encode(args: ExtructionArgs): HexString {
    const builder = new BytesBuilder()
    builder.addAddress(args.target.toString())
    builder.addBytes(args.extructionArgs.toString())

    return new HexString(builder.asHex())
  }

  decode(data: HexString): ExtructionArgs {
    const iter = BytesIter.HexString(data.toString())
    const target = new Address(iter.nextAddress())

    const extructionArgs = new HexString(iter.rest())

    return new ExtructionArgs(target, extructionArgs)
  }
}
