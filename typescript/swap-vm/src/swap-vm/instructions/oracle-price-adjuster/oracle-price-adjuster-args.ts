import type { Address, HexString } from '@1inch/sdk-core'
import { UINT_8_MAX, UINT_16_MAX, UINT_64_MAX } from '@1inch/byte-utils'
import assert from 'node:assert'
import { OraclePriceAdjusterArgsCoder } from './oracle-price-adjuster-args-coder'
import type { IArgsData } from '../types'

/**
 * @notice Oracle Price Adjuster instruction for dynamic price adjustment based on Chainlink price feeds
 * @dev Adjusts swap prices to match Chainlink oracle prices within safe bounds:
 * - Works only for 1=>0 swaps (token1 to token0), compatible with LimitSwap and other swap instructions
 * - Fetches current market price from a Chainlink oracle (AggregatorV3Interface)
 * - Adjusts the swap price towards the oracle price within maxPriceDecay limits
 * - Ensures the adjustment is always favorable for the taker
 * - Handles different decimal places from Chainlink oracles (e.g., 8 decimals for USD prices)
 *
 * This creates adaptive orders that automatically track market prices while maintaining
 * safety bounds to prevent excessive slippage or manipulation.
 *
 * Example usage:
 * 1. LimitSwap sets base price: 1 ETH for 3000 USDC
 * 2. OraclePriceAdjuster with Chainlink ETH/USD oracle: 1 ETH = 3100 USD, maxPriceDecay=0.95e18 (5% max)
 * 3. exactIn: Taker gets more ETH (up to 5% improvement)
 * 4. exactOut: Taker pays less USDC (up to 5% discount)
 *
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/OraclePriceAdjuster.sol#L84
 */
export class OraclePriceAdjusterArgs implements IArgsData {
  public static readonly CODER = new OraclePriceAdjusterArgsCoder()

  /**
   * maxPriceDecay - maximum price decay coefficient (uint64)
   * maxStaleness - maximum allowed oracle data staleness in seconds (uint16
   * oracleDecimals - decimals used by the oracle (uint8)
   * oracleAddress - address of the Chainlink price oracle contract
   **/
  constructor(
    public readonly maxPriceDecay: bigint,
    public readonly maxStaleness: bigint,
    public readonly oracleDecimals: bigint,
    public readonly oracleAddress: Address,
  ) {
    assert(
      maxPriceDecay >= 0n && maxPriceDecay <= UINT_64_MAX,
      `Invalid maxPriceDecay: ${maxPriceDecay}. Must be a valid uint64`,
    )
    assert(maxPriceDecay < 1e18, `Max price decay should be less than 1e18: ${maxPriceDecay}`)
    assert(
      maxStaleness >= 0n && maxStaleness <= UINT_16_MAX,
      `Invalid maxStaleness: ${maxStaleness}. Must be a valid uint16`,
    )
    assert(
      oracleDecimals >= 0n && oracleDecimals <= UINT_8_MAX,
      `Invalid oracleDecimals: ${oracleDecimals}. Must be a valid uint8`,
    )
  }

  /**
   * Decodes hex data into OraclePriceAdjusterArgs instance
   **/
  static decode(data: HexString): OraclePriceAdjusterArgs {
    return OraclePriceAdjusterArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      maxPriceDecay: this.maxPriceDecay.toString(),
      maxStaleness: this.maxStaleness.toString(),
      oracleDecimals: this.oracleDecimals.toString(),
      oracleAddress: this.oracleAddress.toString(),
    }
  }
}
