// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address, HexString } from '@1inch/sdk-core'
import { UINT_32_MAX, UINT_256_MAX } from '@1inch/byte-utils'
import assert from 'node:assert'
import { StableSwap2DArgsCoder } from './stable-swap-2d-args-coder'
import type { IArgsData } from '../types'

/**
 * Arguments for stableSwap2D instruction for stablecoin optimized swaps
 **/
export class StableSwap2DArgs implements IArgsData {
  public static readonly CODER = new StableSwap2DArgsCoder()

  /**
   * fee - swap fee in 1e10 (uint32)
   * A - amplification coefficient (uint32)
   * rateLt - rate for token with lower address (uint256)
   * rateGt - rate for token with higher address (uint256)
   **/
  constructor(
    public readonly fee: bigint,
    public readonly A: bigint,
    public readonly rateLt: bigint,
    public readonly rateGt: bigint,
  ) {
    assert(fee >= 0n && fee <= UINT_32_MAX, `Invalid fee: ${fee}`)
    assert(A >= 0n && A <= UINT_32_MAX, `Invalid A: ${A}`)
    assert(
      rateLt > 0n && rateLt <= UINT_256_MAX,
      `Invalid rateLt: ${rateLt}. Must be positive and <= UINT_256_MAX`,
    )
    assert(
      rateGt > 0n && rateGt <= UINT_256_MAX,
      `Invalid rateGt: ${rateGt}. Must be positive and <= UINT_256_MAX`,
    )
  }

  static fromTokens(
    fee: bigint,
    a: bigint,
    tokenA: Address,
    tokenB: Address,
    rateA: bigint,
    rateB: bigint,
  ): StableSwap2DArgs {
    if (BigInt(tokenA.toString()) < BigInt(tokenB.toString())) {
      return new StableSwap2DArgs(fee, a, rateA, rateB)
    }

    return new StableSwap2DArgs(fee, a, rateB, rateA)
  }

  /**
   * Decodes hex data into StableSwap2DArgs instance
   **/
  static decode(data: HexString): StableSwap2DArgs {
    return StableSwap2DArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      fee: this.fee.toString(),
      A: this.A.toString(),
      rateLt: this.rateLt.toString(),
      rateGt: this.rateGt.toString(),
    }
  }
}
