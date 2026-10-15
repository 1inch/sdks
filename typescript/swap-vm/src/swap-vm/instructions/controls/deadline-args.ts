// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString } from '@1inch/sdk-core'
import { UINT_40_MAX } from '@1inch/byte-utils'
import assert from 'assert'
import { DeadlineArgsCoder } from './deadline-args-coder'
import type { IArgsCoder, IArgsData } from '../types'

export class DeadlineArgs implements IArgsData {
  public static readonly CODER: IArgsCoder<DeadlineArgs> = new DeadlineArgsCoder()

  constructor(public readonly deadline: bigint) {
    assert(
      deadline > 0n && deadline <= UINT_40_MAX,
      `Invalid deadline: ${deadline}. Must be > 0 and <= UINT_40_MAX`,
    )
  }

  static decode(data: HexString): DeadlineArgs {
    return DeadlineArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      deadline: this.deadline.toString(),
    }
  }
}
