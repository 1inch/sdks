// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString } from '@1inch/sdk-core'
import { SaltArgs } from './salt-args'
import type { IArgsCoder } from '../types'

export class SaltArgsCoder implements IArgsCoder<SaltArgs> {
  encode(args: SaltArgs): HexString {
    return args.bytes
  }

  decode(data: HexString): SaltArgs {
    return new SaltArgs(data)
  }
}
