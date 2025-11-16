// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString, AddressHalf } from '@1inch/sdk-core'
import { JumpIfTokenArgsCoder } from './jump-if-token-args-coder'
import type { IArgsData } from '../types'

export class JumpIfTokenArgs implements IArgsData {
  public static readonly CODER = new JumpIfTokenArgsCoder()

  constructor(
    public readonly tokenTail: AddressHalf,
    public readonly nextPC: bigint,
  ) {}

  static decode(data: HexString): JumpIfTokenArgs {
    return JumpIfTokenArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      tokenTail: this.tokenTail.toString(),
      nextPC: this.nextPC,
    }
  }
}
