import type { HexString } from '@1inch/sdk-core'
import { UINT_256_MAX } from '@1inch/byte-utils'
import assert from 'node:assert'
import { TWAPSwapArgsCoder } from './twap-swap-args-coder'
import type { IArgsData } from '../types'

/**
 * @notice TWAP Hook with exponential dutch auction and illiquidity handling
 * @dev Implements a TWAP (Time-Weighted Average Price) selling strategy with the following features:
 * - Linear liquidity unlocking over time
 * - Exponential price decay (dutch auction) for better price discovery
 * - Automatic price bump after periods of insufficient liquidity
 * - Minimum trade size enforcement during TWAP duration
 *
 * Minimum Trade Size (minTradeAmountOut):
 * The minimum trade size protects against gas cost impact on execution price.
 * It should be set 1000x+ larger than the expected transaction fees on the deployment network.
 *
 * For example:
 * - Ethereum mainnet with $50 gas cost → minTradeAmountOut should be $50,000+
 * - Arbitrum/Optimism with $0.50 gas cost → minTradeAmountOut should be $500+
 * - BSC/Polygon with $0.05 gas cost → minTradeAmountOut should be $50+
 *
 * This ensures gas costs remain negligible (<0.1%) relative to trade value.
 *
 * Price Bump Configuration Guidelines:
 *
 * The priceBumpAfterIlliquidity compensates for mandatory waiting periods due to linear unlocking.
 * Time to unlock minTradeAmountOut = (minTradeAmountOut / balance0) * duration
 *
 * Examples:
 * - minTradeAmountOut = 0.1% of balance0, duration = 24h → 14.4 min to unlock each min trade
 *   Recommended bump: 1.05e18 - 1.10e18 (5-10%)
 *
 * - minTradeAmountOut = 1% of balance0, duration = 24h → 14.4 min to unlock each min trade
 *   Recommended bump: 1.10e18 - 1.20e18 (10-20%)
 *
 * - minTradeAmountOut = 5% of balance0, duration = 24h → 1.2 hours to unlock each min trade
 *   Recommended bump: 1.30e18 - 1.50e18 (30-50%)
 *
 * - minTradeAmountOut = 10% of balance0, duration = 24h → 2.4 hours to unlock each min trade
 *   Recommended bump: 1.50e18 - 2.00e18 (50-100%)
 *
 * Additional factors to consider:
 * - Network gas costs: Higher gas requires larger bumps
 * - Pair volatility: Volatile pairs need larger bumps to compensate for price risk
 * - Market depth: Thin markets may need higher bumps to attract arbitrageurs
 *
 * The bump should ensure profitability after the mandatory waiting period.
 *
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/TWAPSwap.sol#L104
 */
export class TWAPSwapArgs implements IArgsData {
  public static readonly CODER = new TWAPSwapArgsCoder()

  /**
   * balanceIn - expected amount of token1 for initial price (uint256)
   * balanceOut - total amount of token0 for TWAP (uint256)
   * startTime - TWAP start time (uint256)
   * duration - TWAP duration (uint256)
   * priceBumpAfterIlliquidity - price jump when liquidity insufficient, e.g. 1.10e18 = +10% (uint256)
   * minTradeAmountOut - minimum trade size for token0 (uint256)
   **/
  constructor(
    public readonly balanceIn: bigint,
    public readonly balanceOut: bigint,
    public readonly startTime: bigint,
    public readonly duration: bigint,
    public readonly priceBumpAfterIlliquidity: bigint,
    public readonly minTradeAmountOut: bigint,
  ) {
    assert(
      balanceIn >= 0n && balanceIn <= UINT_256_MAX,
      `Invalid balanceIn: ${balanceIn}. Must be >= 0 and <= UINT_256_MAX`,
    )
    assert(
      balanceOut >= 0n && balanceOut <= UINT_256_MAX,
      `Invalid balanceOut: ${balanceOut}. Must be >= 0 and <= UINT_256_MAX`,
    )
    assert(
      startTime >= 0n && startTime <= UINT_256_MAX,
      `Invalid startTime: ${startTime}. Must be >= 0 and <= UINT_256_MAX`,
    )
    assert(
      duration >= 0n && duration <= UINT_256_MAX,
      `Invalid duration: ${duration}. Must be >= 0 and <= UINT_256_MAX`,
    )
    assert(
      priceBumpAfterIlliquidity >= 0n && priceBumpAfterIlliquidity <= UINT_256_MAX,
      `Invalid priceBumpAfterIlliquidity: ${priceBumpAfterIlliquidity}. Must be >= 0 and <= UINT_256_MAX`,
    )
    assert(
      minTradeAmountOut >= 0n && minTradeAmountOut <= UINT_256_MAX,
      `Invalid minTradeAmountOut: ${minTradeAmountOut}. Must be >= 0 and <= UINT_256_MAX`,
    )
  }

  /**
   * Decodes hex data into TWAPSwapArgs instance
   **/
  static decode(data: HexString): TWAPSwapArgs {
    return TWAPSwapArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      balanceIn: this.balanceIn.toString(),
      balanceOut: this.balanceOut.toString(),
      startTime: this.startTime.toString(),
      duration: this.duration.toString(),
      priceBumpAfterIlliquidity: this.priceBumpAfterIlliquidity.toString(),
      minTradeAmountOut: this.minTradeAmountOut.toString(),
    }
  }
}
