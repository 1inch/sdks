import type { HexString } from '@1inch/sdk-core'
import { UINT_24_MAX, UINT_64_MAX, UINT_96_MAX } from '@1inch/byte-utils'
import assert from 'node:assert'
import { BaseFeeAdjusterArgsCoder } from './base-fee-adjuster-args-coder'
import type { IArgsData } from '../types'

/**
 * @notice Base Fee Gas Price Adjuster instruction for dynamic price adjustment based on network gas costs
 * @dev Adjusts swap prices based on current gas conditions to compensate for transaction costs:
 * - Works only for 1=>0 swaps (token1 to token0), compatible with LimitSwap and DutchAuction
 * - When gas price exceeds base level, maker improves the price to compensate taker for gas costs
 * - The adjustment is proportional to the difference between current and base gas prices
 * - Maximum adjustment is limited by maxPriceDecay parameter
 *
 * This creates adaptive limit orders that automatically become more attractive during high gas periods,
 * ensuring execution even when transaction costs are elevated.
 *
 * Example usage:
 * 1. LimitSwap sets base price: 1 ETH for 3000 USDC
 * 2. BaseFeeAdjuster with baseGasPrice=20 gwei, current=100 gwei
 * 3. Extra cost = 80 gwei * 150k gas * 3000 USDC/ETH = 36 USDC
 * 4. With maxPriceDecay=0.99e18 (1% max), final price: 1 ETH for 2970 USDC
 *
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/BaseFeeAdjuster.sol#L75
 */
export class BaseFeeAdjusterArgs implements IArgsData {
  public static readonly CODER = new BaseFeeAdjusterArgsCoder()

  /**
   * baseGasPrice - base gas price for comparison (uint64)
   * ethToToken1Price - ETH price in token1 units, e.g.,
   * 3000e18 for 1 ETH = 3000 USDC (uint96)
   * gasAmount - gas amount to compensate for (uint24)
   **/
  constructor(
    public readonly baseGasPrice: bigint,
    public readonly ethToToken1Price: bigint,
    public readonly gasAmount: bigint,
    public readonly maxPriceDecay: bigint,
  ) {
    assert(
      baseGasPrice >= 0n && baseGasPrice <= UINT_64_MAX,
      `Invalid baseGasPrice: ${baseGasPrice}. Must be a valid uint64`,
    )
    assert(
      ethToToken1Price >= 0n && ethToToken1Price <= UINT_96_MAX,
      `Invalid ethToToken1Price: ${ethToToken1Price}. Must be a valid uint96`,
    )
    assert(
      gasAmount >= 0n && gasAmount <= UINT_24_MAX,
      `Invalid gasAmount: ${gasAmount}. Must be a valid uint24`,
    )
    assert(
      maxPriceDecay >= 0n && maxPriceDecay <= UINT_64_MAX,
      `Invalid maxPriceDecay: ${maxPriceDecay}. Must be a valid uint64`,
    )
  }

  /**
   * Decodes hex data into BaseFeeAdjusterArgs instance
   **/
  static decode(data: HexString): BaseFeeAdjusterArgs {
    return BaseFeeAdjusterArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      baseGasPrice: this.baseGasPrice.toString(),
      ethToToken1Price: this.ethToToken1Price.toString(),
      gasAmount: this.gasAmount.toString(),
      maxPriceDecay: this.maxPriceDecay.toString(),
    }
  }
}
