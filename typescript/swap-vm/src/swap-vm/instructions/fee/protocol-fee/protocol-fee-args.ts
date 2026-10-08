// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address, HexString } from '@1inch/sdk-core'
import { UINT_32_MAX } from '@1inch/byte-utils'
import assert from 'assert'
import { ProtocolFeeArgsCoder } from './protocol-fee-args-coder'
import type { IArgsCoder, IArgsData } from '../../types'
import { bpsToFeeUnits, percentToFeeUnits } from '../fee-units'

const FEE_100_PERCENT = 1e9 // 1e9 = 100%

/**
 * Arguments for protocol fee instructions (protocolFeeAmountInXD, aquaProtocolFeeAmountInXD)
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L101
 **/
export class ProtocolFeeArgs implements IArgsData {
  public static readonly CODER: IArgsCoder<ProtocolFeeArgs> = new ProtocolFeeArgsCoder()

  /**
   * fee - 1e9 = 100% (uint32)
   * to - address to send pulled tokens to (20 bytes)
   **/
  constructor(
    public readonly fee: bigint,
    public readonly to: Address,
  ) {
    assert(fee >= 0n && fee <= UINT_32_MAX, `Invalid fee: ${fee}. Must be a valid uint32`)
    assert(
      fee <= BigInt(FEE_100_PERCENT),
      `Fee out of range: ${fee}. Must be <= ${FEE_100_PERCENT}`,
    )
  }

  /**
   * Decodes hex data into ProtocolFeeArgs instance
   **/
  static decode(data: HexString): ProtocolFeeArgs {
    return ProtocolFeeArgs.CODER.decode(data)
  }

  /**
   * Creates a ProtocolFeeArgs instance from percentage
   * @param percent - Fee as percentage (e.g., 1 for 1%, 0.1 for 0.1%), at most 7 decimal places
   * @param to - Address to receive the protocol fee
   * @returns ProtocolFeeArgs instance
   * @throws if `percent` is not a non-negative multiple of 0.0000001% or exceeds 100%
   */
  public static fromPercent(percent: number, to: Address): ProtocolFeeArgs {
    return new ProtocolFeeArgs(percentToFeeUnits(percent), to)
  }

  /**
   * Creates a ProtocolFeeArgs instance from basis points
   * @param bps - Fee in basis points (10000 bps = 100%), at most 5 decimal places
   * @param to - Address to receive the protocol fee
   * @returns ProtocolFeeArgs instance
   * @throws if `bps` is not a non-negative multiple of 0.00001 bps or exceeds 100%
   */
  public static fromBps(bps: number, to: Address): ProtocolFeeArgs {
    return new ProtocolFeeArgs(bpsToFeeUnits(bps), to)
  }

  toJSON(): Record<string, unknown> {
    return {
      fee: this.fee.toString(),
      to: this.to.toString(),
    }
  }
}
