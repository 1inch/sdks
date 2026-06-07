// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BytesBuilder, BytesIter } from '@1inch/byte-utils'
import { Address, HexString } from '@1inch/sdk-core'
import { DynamicProtocolFeeArgs } from './dynamic-protocol-fee-args'
import type { IArgsCoder } from '../../types'

export class DynamicProtocolFeeArgsCoder implements IArgsCoder<DynamicProtocolFeeArgs> {
  encode(args: DynamicProtocolFeeArgs): HexString {
    const builder = new BytesBuilder()
    builder.addAddress(args.feeProvider.toString())

    return new HexString(builder.asHex())
  }

  decode(data: HexString): DynamicProtocolFeeArgs {
    const iter = BytesIter.HexString(data.toString())
    const feeProvider = new Address(iter.nextAddress())

    return new DynamicProtocolFeeArgs(feeProvider)
  }
}
