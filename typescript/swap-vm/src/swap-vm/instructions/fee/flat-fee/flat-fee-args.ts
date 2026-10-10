// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString } from '@1inch/sdk-core'
import { UINT_32_MAX } from '@1inch/byte-utils'
import assert from 'assert'
import { FlatFeeArgsCoder } from './flat-fee-args-coder'
import type { IArgsCoder, IArgsData } from '../../types'
import { bpsToFeeUnits, percentToFeeUnits } from '../fee-units'

const FEE_100_PERCENT = 1e9 // 1e9 = 100%

/**
 * Arguments for flat fee instructions (flatFeeAmountInXD)
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L66
 **/
export class FlatFeeArgs implements IArgsData {
  public static readonly CODER: IArgsCoder<FlatFeeArgs> = new FlatFeeArgsCoder()

  constructor(public readonly fee: bigint) {
    assert(fee >= 0n && fee <= UINT_32_MAX, `Invalid fee: ${fee}. Must be a valid uint32`)
    assert(
      fee <= BigInt(FEE_100_PERCENT),
      `Fee out of range: ${fee}. Must be <= ${FEE_100_PERCENT}`,
    )
  }

  /**
   * Decodes hex data into FlatFeeArgs instance
   **/
  static decode(data: HexString): FlatFeeArgs {
    return FlatFeeArgs.CODER.decode(data)
  }

  /**
   * Creates a FlatFeeArgs instance from percentage
   * @param percent - Fee as percentage (e.g., 1 for 1%, 0.1 for 0.1%), at most 7 decimal places
   * @returns FlatFeeArgs instance
   * @throws if `percent` is not a non-negative multiple of 0.0000001% or exceeds 100%
   */
  public static fromPercent(percent: number): FlatFeeArgs {
    return new FlatFeeArgs(percentToFeeUnits(percent))
  }

  /**
   * Creates a FlatFeeArgs instance from basis points
   * @param bps - Fee in basis points (10000 bps = 100%), at most 5 decimal places
   * @returns FlatFeeArgs instance
   * @throws if `bps` is not a non-negative multiple of 0.00001 bps or exceeds 100%
   */
  public static fromBps(bps: number): FlatFeeArgs {
    return new FlatFeeArgs(bpsToFeeUnits(bps))
  }

  toJSON(): Record<string, unknown> {
    return {
      fee: this.fee.toString(),
    }
  }
}
