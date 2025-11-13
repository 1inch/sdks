import type { HexString } from '@1inch/sdk-core'
import { UINT_16_MAX, UINT_32_MAX, UINT_40_MAX } from '@1inch/byte-utils'
import assert from 'node:assert'
import { DutchAuctionArgsCoder } from './dutch-auction-args-coder'
import type { IArgsData } from '../types'

/**
 * @notice Dutch Auction instruction for time-based price decay with deadline
 * @dev Implements an exponential decay auction mechanism that works after any swap:
 * - Designed to be used after any swap instruction (LimitSwap, XYCSwap, etc.) which sets amounts
 * - Applies time-based decay to the amounts calculated by the previous swap
 * - Maker sells token0 and receives token1
 * - Price improves for taker over time through exponential decay until deadline
 * - Reverts if current time exceeds deadline
 * - Only works for 1=>0 swaps (token1 to token0)
 *
 * The decay factor determines the price reduction rate:
 * - 1.0e18 = no decay (constant price)
 * - 0.999e18 = 0.1% decay per second
 * - 0.99e18 = 1% decay per second
 * - 0.9e18 = 10% decay per second
 *
 * Example usage:
 * 1. Any swap instruction sets: 100 token1 → 1000 token0
 * 2. DutchAuction with decayFactor = 0.99e18, after 100 seconds:
 *    - exactIn: Taker gets ~2.73x more token0 for the same token1
 *    - exactOut: Taker needs only ~36.6% of initial token1
 * 3. After deadline, the auction expires and cannot be executed
 *
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/DutchAuction.sol#L66
 */
export class DutchAuctionArgs implements IArgsData {
  public static readonly CODER = new DutchAuctionArgsCoder()

  /**
   * startTime - auction start time (uint40)
   * duration - auction duration in seconds (uint16)
   * decayFactor - price decay per second, 1e18 = no decay (uint32)
   **/
  constructor(
    public readonly startTime: bigint,
    public readonly duration: bigint,
    public readonly decayFactor: bigint,
  ) {
    assert(
      startTime >= 0n && startTime <= UINT_40_MAX,
      `Invalid startTime: ${startTime}. Must be a valid uint40`,
    )
    assert(
      duration >= 0n && duration <= UINT_16_MAX,
      `Invalid duration: ${duration}. Must be a valid uint16`,
    )
    assert(
      decayFactor >= 0n && decayFactor <= UINT_32_MAX,
      `Invalid decayFactor: ${decayFactor}. Must be a valid uint32`,
    )
    assert(decayFactor < 1e18, `Decay factor should be less than 1e18: ${decayFactor}`)
  }

  /**
   * Decodes hex data into DutchAuctionArgs instance
   **/
  static decode(data: HexString): DutchAuctionArgs {
    return DutchAuctionArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      startTime: this.startTime.toString(),
      duration: this.duration.toString(),
      decayFactor: this.decayFactor.toString(),
    }
  }
}
