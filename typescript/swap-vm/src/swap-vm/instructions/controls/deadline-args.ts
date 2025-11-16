// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString } from '@1inch/sdk-core'
import { DeadlineArgsCoder } from './deadline-args-coder'
import type { IArgsData } from '../types'

export class DeadlineArgs implements IArgsData {
  public static readonly CODER = new DeadlineArgsCoder()

  constructor(public readonly deadline: bigint) {}

  static decode(data: HexString): DeadlineArgs {
    return DeadlineArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      deadline: this.deadline.toString(),
    }
  }
}
