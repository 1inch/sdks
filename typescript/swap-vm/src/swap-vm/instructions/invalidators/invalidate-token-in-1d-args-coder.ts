// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { HexString } from '@1inch/sdk-core'
import { InvalidateTokenIn1DArgs } from './invalidate-token-in-1d-args'
import type { IArgsCoder } from '../types'

export class InvalidateTokenIn1DArgsCoder implements IArgsCoder<InvalidateTokenIn1DArgs> {
  encode(_args: InvalidateTokenIn1DArgs): HexString {
    return new HexString('0x')
  }

  decode(_data: HexString): InvalidateTokenIn1DArgs {
    return new InvalidateTokenIn1DArgs()
  }
}
