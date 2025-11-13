import type { HexString } from '@1inch/sdk-core'
import { UINT_32_MAX } from '@1inch/byte-utils'
import assert from 'node:assert'
import { FlatFeeArgsCoder } from './flat-fee-args-coder'
import type { IArgsData } from '../types'

const FEE_100_PERCENT = 1e9 // 1e9 = 100%

/**
 * Arguments for flat fee instructions (flatFeeXD, flatFeeAmountInXD, flatFeeAmountOutXD, progressiveFeeXD)
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L66
 **/
export class FlatFeeArgs implements IArgsData {
  public static readonly CODER = new FlatFeeArgsCoder()

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
   * @param percent - Fee as percentage (e.g., 1 for 1%, 0.1 for 0.1%)
   * @returns FlatFeeArgs instance
   */
  public static fromPercent(percent: number): FlatFeeArgs {
    return FlatFeeArgs.fromBps(percent * 100)
  }

  /**
   * Creates a FlatFeeArgs instance from basis points
   * @param bps - Fee in basis points (10000 bps = 100%)
   * @returns FlatFeeArgs instance
   */
  public static fromBps(bps: number): FlatFeeArgs {
    const fee = BigInt(bps * 100000)

    return new FlatFeeArgs(fee)
  }

  toJSON(): Record<string, unknown> {
    return {
      fee: this.fee.toString(),
    }
  }
}
