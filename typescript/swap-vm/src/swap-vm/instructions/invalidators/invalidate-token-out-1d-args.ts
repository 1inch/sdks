// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString } from '@1inch/sdk-core'
import { InvalidateTokenOut1DArgsCoder } from './invalidate-token-out-1d-args-coder'
import type { IArgsData } from '../types'

export class InvalidateTokenOut1DArgs implements IArgsData {
  public static readonly CODER = new InvalidateTokenOut1DArgsCoder()

  constructor() {}

  static decode(data: HexString): InvalidateTokenOut1DArgs {
    return InvalidateTokenOut1DArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {}
  }
}
