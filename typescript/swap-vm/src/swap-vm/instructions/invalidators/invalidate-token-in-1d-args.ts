// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString } from '@1inch/sdk-core'
import { InvalidateTokenIn1DArgsCoder } from './invalidate-token-in-1d-args-coder'
import type { IArgsData } from '../types'

export class InvalidateTokenIn1DArgs implements IArgsData {
  public static readonly CODER = new InvalidateTokenIn1DArgsCoder()

  constructor() {}

  static decode(data: HexString): InvalidateTokenIn1DArgs {
    return InvalidateTokenIn1DArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {}
  }
}
