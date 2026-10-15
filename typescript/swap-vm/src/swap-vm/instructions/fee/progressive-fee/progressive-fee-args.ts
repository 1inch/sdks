// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString } from '@1inch/sdk-core'
import { UINT_32_MAX } from '@1inch/byte-utils'
import assert from 'assert'
import { ProgressiveFeeArgsCoder } from './progressive-fee-args-coder'
import type { IArgsCoder, IArgsData } from '../../types'

const FEE_100_PERCENT = 1e9 // 1e9 = 100%

/**
 * Arguments for progressive fee instructions (progressiveFeeInXD, progressiveFeeOutXD)
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/FeeExperimental.sol#L23
 **/
export class ProgressiveFeeArgs implements IArgsData {
  public static readonly CODER: IArgsCoder<ProgressiveFeeArgs> = new ProgressiveFeeArgsCoder()

  /**
   * fee - base fee (lambda), 1e9 = 100% (uint32). Unlike flat fees, 100% is a valid value:
   * the progressive formulas never divide by (1e9 - fee)
   **/
  constructor(public readonly fee: bigint) {
    assert(fee >= 0n && fee <= UINT_32_MAX, `Invalid fee: ${fee}. Must be a valid uint32`)
    assert(
      fee <= BigInt(FEE_100_PERCENT),
      `Fee out of range: ${fee}. Must be <= ${FEE_100_PERCENT}`,
    )
  }

  /**
   * Decodes hex data into ProgressiveFeeArgs instance
   **/
  static decode(data: HexString): ProgressiveFeeArgs {
    return ProgressiveFeeArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      fee: this.fee.toString(),
    }
  }
}
