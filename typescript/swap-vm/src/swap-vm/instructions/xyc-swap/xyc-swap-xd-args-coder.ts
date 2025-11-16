// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { HexString } from '@1inch/sdk-core'
import { XycSwapXDArgs } from './xyc-swap-xd-args'
import type { IArgsCoder } from '../types'

export class XycSwapXDArgsCoder implements IArgsCoder<XycSwapXDArgs> {
  encode(_args: XycSwapXDArgs): HexString {
    return new HexString('0x')
  }

  decode(_data: HexString): XycSwapXDArgs {
    return new XycSwapXDArgs()
  }
}
