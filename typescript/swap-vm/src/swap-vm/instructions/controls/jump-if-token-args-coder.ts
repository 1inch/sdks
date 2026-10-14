// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { Address, HexString } from '@1inch/sdk-core'
import { JumpIfTokenArgs } from './jump-if-token-args'
import type { IArgsCoder } from '../types'

export class JumpIfTokenArgsCoder implements IArgsCoder<JumpIfTokenArgs> {
  encode(args: JumpIfTokenArgs): HexString {
    const builder = new BytesBuilder()
    builder.addAddress(args.token.toString())
    builder.addUint16(args.nextPC)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): JumpIfTokenArgs {
    const iter = BytesIter.HexString(data.toString())
    const token = new Address(iter.nextAddress())
    const nextPC = BigInt(iter.nextUint16())

    return new JumpIfTokenArgs(token, nextPC)
  }
}
