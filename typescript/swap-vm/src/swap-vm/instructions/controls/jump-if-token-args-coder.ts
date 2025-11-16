// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { AddressHalf, HexString } from '@1inch/sdk-core'
import { JumpIfTokenArgs } from './jump-if-token-args'
import type { IArgsCoder } from '../types'

export class JumpIfTokenArgsCoder implements IArgsCoder<JumpIfTokenArgs> {
  encode(args: JumpIfTokenArgs): HexString {
    const builder = new BytesBuilder()
    builder.addBytes(args.tokenTail.toString())
    builder.addUint16(args.nextPC)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): JumpIfTokenArgs {
    const iter = BytesIter.HexString(data.toString())
    const tokenTailBytes = iter.nextBytes(10)
    const tokenTail = AddressHalf.fromHex(tokenTailBytes)
    const nextPC = BigInt(iter.nextUint16())

    return new JumpIfTokenArgs(tokenTail, nextPC)
  }
}
