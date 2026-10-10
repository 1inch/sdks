// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { parseUnits } from 'viem'
import type { SwapVmProgram } from '../../index'
import { Address, AquaProgramBuilder, AquaXYCAmmStrategy, instructions } from '../../index'

const { concentrate, fee } = instructions

const USDC = new Address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
const WETH = new Address('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')

/**
 * Reads the concentrate bounds back from a built program as human USDC per WETH prices,
 * rounded to the 6 USDC decimals: `[at sqrtPriceMin, at sqrtPriceMax]`
 */
function concentrateBoundsInUsdcPerWeth(program: SwapVmProgram): string[] {
  const [concentrateIx] = AquaProgramBuilder.decode(program).getInstructions()
  expect(concentrateIx.opcode.id.toString()).toContain('concentrateGrowLiquidity2D')

  const { sqrtPriceMin, sqrtPriceMax } =
    concentrateIx.args as instructions.concentrate.ConcentrateGrowLiquidity2DArgs
  const tokens = {
    tokenA: { address: USDC, decimals: 6n },
    tokenB: { address: WETH, decimals: 18n },
  }

  return [sqrtPriceMin, sqrtPriceMax].map((sqrtPrice) =>
    concentrate.Price.fromSqrt(sqrtPrice, tokens).toHuman(USDC),
  )
}

/**
 * `SimpleAmmStrategy` from the README "Creating your own strategies" section
 */
class SimpleAmmStrategy {
  private rawPriceMin?: bigint

  private rawPriceMax?: bigint

  private feeBpsIn?: number

  constructor(
    public readonly tokenA: Address,
    public readonly tokenB: Address,
  ) {}

  public withPriceRange(rawPriceMin: bigint, rawPriceMax: bigint): this {
    this.rawPriceMin = rawPriceMin
    this.rawPriceMax = rawPriceMax

    return this
  }

  public withFeeTokenIn(bps: number): this {
    this.feeBpsIn = bps

    return this
  }

  public build(): SwapVmProgram {
    const builder = new AquaProgramBuilder()

    if (this.rawPriceMin !== undefined && this.rawPriceMax !== undefined) {
      const data = concentrate.ConcentrateGrowLiquidity2DArgs.fromRawPrices(
        this.rawPriceMin,
        this.rawPriceMax,
      )
      builder.add(concentrate.concentrateGrowLiquidity2D.createIx(data))
    }

    if (this.feeBpsIn !== undefined) {
      const feeArgs = fee.FlatFeeArgs.fromBps(this.feeBpsIn)
      builder.add(fee.flatFeeAmountInXD.createIx(feeArgs))
    }

    builder.xycSwapXD()

    return builder.build()
  }
}

describe('README concentrated liquidity examples', () => {
  it('Quick Start: should provide liquidity between 1500 and 3000 USDC per WETH', () => {
    const { Price } = instructions.concentrate
    const usdcPerWeth = {
      quoteToken: { address: USDC, decimals: 6n },
      baseToken: { address: WETH, decimals: 18n },
    }
    const program = AquaXYCAmmStrategy.newConcentrate({
      sqrtPriceMin: Price.fromHuman('3000', usdcPerWeth).toSqrt(),
      sqrtPriceMax: Price.fromHuman('1500', usdcPerWeth).toSqrt(),
    }).build()

    expect(concentrateBoundsInUsdcPerWeth(program)).toEqual(['3000', '1500'])
  })

  it('SimpleAmmStrategy: should concentrate liquidity between 1500 and 3000 USDC per WETH', () => {
    const { ONE_E18 } = concentrate
    const oneWeth = parseUnits('1', 18)

    const program = new SimpleAmmStrategy(USDC, WETH)
      .withPriceRange(
        (oneWeth * ONE_E18) / parseUnits('3000', 6),
        (oneWeth * ONE_E18) / parseUnits('1500', 6),
      )
      .withFeeTokenIn(5)
      .build()

    expect(concentrateBoundsInUsdcPerWeth(program)).toEqual(['3000', '1500'])
  })
})
