import type { Address, HexString } from '@1inch/sdk-core'
import { UINT_64_MAX } from '@1inch/byte-utils'
import assert from 'node:assert'
import { MinRateArgsCoder } from './min-rate-args-coder'
import type { IArgsData } from '../types'

/**
 * Arguments for min rate instructions (requireMinRate1D, adjustMinRate1D)
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/MinRate.sol#L36
 **/
export class MinRateArgs implements IArgsData {
  public static readonly CODER = new MinRateArgsCoder()

  /**
   * rateLt - minimum acceptable rate for token with lower address (uint64)
   * rateGt - minimum acceptable rate for token with higher address (uint64)
   **/
  constructor(
    public readonly rateLt: bigint,
    public readonly rateGt: bigint,
  ) {
    assert(
      rateLt >= 0n && rateLt <= UINT_64_MAX,
      `Invalid rateLt: ${rateLt}. Must be a valid uint64`,
    )
    assert(
      rateGt >= 0n && rateGt <= UINT_64_MAX,
      `Invalid rateGt: ${rateGt}. Must be a valid uint64`,
    )
  }

  static fromTokens(tokenA: Address, tokenB: Address, rateA: bigint, rateB: bigint): MinRateArgs {
    if (BigInt(tokenA.toString()) < BigInt(tokenB.toString())) {
      return new MinRateArgs(rateA, rateB)
    }

    return new MinRateArgs(rateB, rateA)
  }

  /**
   * Decodes hex data into MinRateArgs instance
   **/
  static decode(data: HexString): MinRateArgs {
    return MinRateArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      rateLt: this.rateLt.toString(),
      rateGt: this.rateGt.toString(),
    }
  }
}
