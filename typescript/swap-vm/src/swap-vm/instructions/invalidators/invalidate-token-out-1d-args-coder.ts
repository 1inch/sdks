// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { HexString } from '@1inch/sdk-core'
import { InvalidateTokenOut1DArgs } from './invalidate-token-out-1d-args'
import type { IArgsCoder } from '../types'

export class InvalidateTokenOut1DArgsCoder implements IArgsCoder<InvalidateTokenOut1DArgs> {
  encode(_args: InvalidateTokenOut1DArgs): HexString {
    return new HexString('0x')
  }

  decode(_data: HexString): InvalidateTokenOut1DArgs {
    return new InvalidateTokenOut1DArgs()
  }
}
