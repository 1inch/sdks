// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { ConcentrateGrowLiquidity2DArgs, ONE_E18 } from './concentrate-grow-liquidity-2d-args'
import { ConcentrateGrowLiquidity2DArgsCoder } from './concentrate-grow-liquidity-2d-args-coder'

describe('ConcentrateGrowLiquidity2DArgs', () => {
  const coder = new ConcentrateGrowLiquidity2DArgsCoder()

  it('should encode and decode sqrtPriceMin and sqrtPriceMax', () => {
    const sqrtPriceMin = 9n * 10n ** 17n
    const sqrtPriceMax = 11n * 10n ** 17n
    const args = new ConcentrateGrowLiquidity2DArgs(sqrtPriceMin, sqrtPriceMax)

    const encoded = coder.encode(args)
    expect(encoded.toString().length).toBe(130)

    const decoded = coder.decode(encoded)
    expect(decoded.sqrtPriceMin).toBe(sqrtPriceMin)
    expect(decoded.sqrtPriceMax).toBe(sqrtPriceMax)
  })

  it('should enforce 0 < sqrtPriceMin < sqrtPriceMax', () => {
    expect(() => new ConcentrateGrowLiquidity2DArgs(0n, ONE_E18)).toThrow(/sqrtPriceMin/)
    expect(() => new ConcentrateGrowLiquidity2DArgs(ONE_E18, ONE_E18)).toThrow(
      /must be < sqrtPriceMax/,
    )
    expect(() => new ConcentrateGrowLiquidity2DArgs(2n * ONE_E18, ONE_E18)).toThrow(
      /must be < sqrtPriceMax/,
    )
  })

  it('should handle valid bounds', () => {
    const sqrtPriceMin = 1n
    const sqrtPriceMax = 2n ** 256n - 1n
    const args = new ConcentrateGrowLiquidity2DArgs(sqrtPriceMin, sqrtPriceMax)
    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)
    expect(decoded.sqrtPriceMin).toBe(sqrtPriceMin)
    expect(decoded.sqrtPriceMax).toBe(sqrtPriceMax)
  })

  it('should use static decode method', () => {
    const args = new ConcentrateGrowLiquidity2DArgs(123n, 456n)
    const encoded = coder.encode(args)
    const decoded = ConcentrateGrowLiquidity2DArgs.decode(encoded)
    expect(decoded.sqrtPriceMin).toBe(123n)
    expect(decoded.sqrtPriceMax).toBe(456n)
  })

  it('should convert to JSON', () => {
    const args = new ConcentrateGrowLiquidity2DArgs(100n, 200n)
    const json = args.toJSON()
    expect(json).toEqual({
      sqrtPriceMin: '100',
      sqrtPriceMax: '200',
    })
  })

  it('should build from fromSqrtPrices', () => {
    const sqrtPriceMin = 9n * 10n ** 17n
    const sqrtPriceMax = 11n * 10n ** 17n
    const args = ConcentrateGrowLiquidity2DArgs.fromSqrtPrices(sqrtPriceMin, sqrtPriceMax)
    expect(args.sqrtPriceMin).toBe(sqrtPriceMin)
    expect(args.sqrtPriceMax).toBe(sqrtPriceMax)
    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)
    expect(decoded.sqrtPriceMin).toBe(sqrtPriceMin)
    expect(decoded.sqrtPriceMax).toBe(sqrtPriceMax)
  })

  it('should build from fromRawPrices (P in 1e18: sqrt(P*1e18) = sqrt(P)*1e18)', () => {
    const rawPriceMin = ONE_E18
    const rawPriceMax = 4n * ONE_E18
    const args = ConcentrateGrowLiquidity2DArgs.fromRawPrices(rawPriceMin, rawPriceMax)
    expect(args.sqrtPriceMin).toBe(ONE_E18)
    expect(args.sqrtPriceMax).toBe(2n * ONE_E18)
  })

  it('should round-trip fromRawPrices through encode/decode', () => {
    const rawPriceMin = 2n * ONE_E18
    const rawPriceMax = 8n * ONE_E18
    const args = ConcentrateGrowLiquidity2DArgs.fromRawPrices(rawPriceMin, rawPriceMax)
    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)
    expect(decoded.sqrtPriceMin).toBe(args.sqrtPriceMin)
    expect(decoded.sqrtPriceMax).toBe(args.sqrtPriceMax)
  })

  it('example: USDC/WETH price range (P = tokenGt/tokenLt; USDC < WETH so P = WETH per USDC)', () => {
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    expect(BigInt(USDC) < BigInt(WETH)).toBe(true)

    const rawPriceMin = (ONE_E18 * ONE_E18) / (3000n * 10n ** 6n)
    const rawPriceMax = (ONE_E18 * ONE_E18) / (2000n * 10n ** 6n)

    const args = ConcentrateGrowLiquidity2DArgs.fromRawPrices(rawPriceMin, rawPriceMax)
    expect(args.sqrtPriceMin).toBeGreaterThan(0n)
    expect(args.sqrtPriceMax).toBeGreaterThan(args.sqrtPriceMin)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)
    expect(decoded.sqrtPriceMin).toBe(args.sqrtPriceMin)
    expect(decoded.sqrtPriceMax).toBe(args.sqrtPriceMax)
  })
})
