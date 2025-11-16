// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString } from '@1inch/sdk-core'
import { UINT_16_MAX } from '@1inch/byte-utils'
import assert from 'node:assert'
import { DecayXDArgsCoder } from './decay-xd-args-coder'
import type { IArgsData } from '../types'

/**
 * Arguments for decayXD instruction with decay period
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Decay.sol#L79
 **/
export class DecayXDArgs implements IArgsData {
  public static readonly CODER = new DecayXDArgsCoder()

  constructor(public readonly decayPeriod: bigint) {
    assert(
      decayPeriod >= 0n && decayPeriod <= UINT_16_MAX,
      `Invalid decayPeriod value: ${decayPeriod}. Must be a valid uint16`,
    )
  }

  /**
   * Decodes hex data into DecayXDArgs instance
   **/
  static decode(data: HexString): DecayXDArgs {
    return DecayXDArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      decayPeriod: this.decayPeriod.toString(),
    }
  }
}
