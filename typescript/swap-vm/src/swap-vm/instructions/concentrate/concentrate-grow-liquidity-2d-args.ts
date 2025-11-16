// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address, HexString } from '@1inch/sdk-core'
import { UINT_256_MAX } from '@1inch/byte-utils'
import assert from 'node:assert'
import { ConcentrateGrowLiquidity2DArgsCoder } from './concentrate-grow-liquidity-2d-args-coder'
import type { IArgsData } from '../types'

/**
 * Arguments for concentrateGrowLiquidity2D instruction with two deltas
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/XYCConcentrate.sol#L172
 **/
export class ConcentrateGrowLiquidity2DArgs implements IArgsData {
  public static readonly CODER = new ConcentrateGrowLiquidity2DArgsCoder()

  constructor(
    public readonly deltaLt: bigint,
    public readonly deltaGt: bigint,
  ) {
    assert(
      deltaLt >= 0n && deltaLt <= UINT_256_MAX,
      `Invalid deltaLt: ${deltaLt}. Must be >= 0 and <= UINT_256_MAX`,
    )
    assert(
      deltaGt >= 0n && deltaGt <= UINT_256_MAX,
      `Invalid deltaGt: ${deltaGt}. Must be >= 0 and <= UINT_256_MAX`,
    )
  }

  /**
   * Helper to create args from token addresses and deltas (handles ordering)
   **/
  static fromTokenDeltas(
    tokenA: Address,
    tokenB: Address,
    deltaA: bigint,
    deltaB: bigint,
  ): ConcentrateGrowLiquidity2DArgs {
    const tokenABigInt = BigInt(tokenA.toString())
    const tokenBBigInt = BigInt(tokenB.toString())

    const [deltaLt, deltaGt] = tokenABigInt < tokenBBigInt ? [deltaA, deltaB] : [deltaB, deltaA]

    return new ConcentrateGrowLiquidity2DArgs(deltaLt, deltaGt)
  }

  /**
   * Decodes hex data into ConcentrateGrowLiquidity2DArgs instance
   **/
  static decode(data: HexString): ConcentrateGrowLiquidity2DArgs {
    return ConcentrateGrowLiquidity2DArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      deltaLt: this.deltaLt.toString(),
      deltaGt: this.deltaGt.toString(),
    }
  }
}
