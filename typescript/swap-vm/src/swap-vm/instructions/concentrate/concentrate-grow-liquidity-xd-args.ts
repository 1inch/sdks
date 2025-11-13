import type { HexString } from '@1inch/sdk-core'
import { UINT_256_MAX } from '@1inch/byte-utils'
import assert from 'node:assert'
import { ConcentrateGrowLiquidityXDArgsCoder } from './concentrate-grow-liquidity-xd-args-coder'
import type { TokenDelta } from './types'
import type { IArgsData } from '../types'

/**
 * Arguments for concentrateGrowLiquidityXD instruction with multiple token deltas
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/XYCConcentrate.sol#L139
 **/
export class ConcentrateGrowLiquidityXDArgs implements IArgsData {
  public static readonly CODER = new ConcentrateGrowLiquidityXDArgsCoder()

  constructor(public readonly tokenDeltas: TokenDelta[]) {
    tokenDeltas.forEach((td, index) => {
      assert(
        td.delta >= 0n && td.delta <= UINT_256_MAX,
        `Invalid delta at index ${index}: ${td.delta}. Must be >= 0 and <= UINT_256_MAX`,
      )
    })
  }

  /**
   * Decodes hex data into ConcentrateGrowLiquidityXDArgs instance
   **/
  static decode(data: HexString): ConcentrateGrowLiquidityXDArgs {
    return ConcentrateGrowLiquidityXDArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      tokenDeltas: this.tokenDeltas.map(({ tokenHalf, delta }) => ({
        token: tokenHalf.toString(),
        delta: delta.toString(),
      })),
    }
  }
}
