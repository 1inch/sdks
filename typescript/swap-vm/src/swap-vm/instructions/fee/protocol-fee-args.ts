// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address, HexString } from '@1inch/sdk-core'
import { UINT_32_MAX } from '@1inch/byte-utils'
import assert from 'node:assert'
import { ProtocolFeeArgsCoder } from './protocol-fee-args-coder'
import type { IArgsData } from '../types'

const FEE_100_PERCENT = 1e9 // 1e9 = 100%

/**
 * Arguments for protocol fee instructions (protocolFeeAmountOutXD, aquaProtocolFeeAmountOutXD)
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol#L102
 **/
export class ProtocolFeeArgs implements IArgsData {
  public static readonly CODER = new ProtocolFeeArgsCoder()

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
   * @param percent - Fee as percentage (e.g., 1 for 1%, 0.1 for 0.1%)
   * @param to - Address to receive the protocol fee
   * @returns ProtocolFeeArgs instance
   */
  public static fromPercent(percent: number, to: Address): ProtocolFeeArgs {
    return ProtocolFeeArgs.fromBps(percent * 100, to)
  }

  /**
   * Creates a ProtocolFeeArgs instance from basis points
   * @param bps - Fee in basis points (10000 bps = 100%)
   * @param to - Address to receive the protocol fee
   * @returns ProtocolFeeArgs instance
   */
  public static fromBps(bps: number, to: Address): ProtocolFeeArgs {
    const fee = BigInt(bps * 100000)

    return new ProtocolFeeArgs(fee, to)
  }

  toJSON(): Record<string, unknown> {
    return {
      fee: this.fee.toString(),
      to: this.to.toString(),
    }
  }
}
