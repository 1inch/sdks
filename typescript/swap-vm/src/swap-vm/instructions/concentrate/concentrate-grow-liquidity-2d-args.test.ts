// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { ConcentrateGrowLiquidity2DArgs } from './concentrate-grow-liquidity-2d-args'
import { ConcentrateGrowLiquidity2DArgsCoder } from './concentrate-grow-liquidity-2d-args-coder'

describe('ConcentrateGrowLiquidity2DArgs', () => {
  const coder = new ConcentrateGrowLiquidity2DArgsCoder()

  it('should encode and decode two deltas', () => {
    const deltaLt = 1000n * 10n ** 18n
    const deltaGt = 500n * 10n ** 18n
    const args = new ConcentrateGrowLiquidity2DArgs(deltaLt, deltaGt)

    const encoded = coder.encode(args)
    expect(encoded.toString().length).toBe(130)

    const decoded = coder.decode(encoded)
    expect(decoded.deltaLt).toBe(deltaLt)
    expect(decoded.deltaGt).toBe(deltaGt)
  })

  it('should handle zero deltas', () => {
    const args = new ConcentrateGrowLiquidity2DArgs(0n, 0n)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.deltaLt).toBe(0n)
    expect(decoded.deltaGt).toBe(0n)
  })

  it('should handle large deltas', () => {
    const maxUint256 = 2n ** 256n - 1n
    const args = new ConcentrateGrowLiquidity2DArgs(maxUint256, maxUint256)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.deltaLt).toBe(maxUint256)
    expect(decoded.deltaGt).toBe(maxUint256)
  })

  it('should use static decode method', () => {
    const args = new ConcentrateGrowLiquidity2DArgs(123n, 456n)
    const encoded = coder.encode(args)

    const decoded = ConcentrateGrowLiquidity2DArgs.decode(encoded)
    expect(decoded.deltaLt).toBe(123n)
    expect(decoded.deltaGt).toBe(456n)
  })

  it('should convert to JSON', () => {
    const args = new ConcentrateGrowLiquidity2DArgs(100n, 200n)
    const json = args.toJSON()

    expect(json).toEqual({
      deltaLt: '100',
      deltaGt: '200',
    })
  })

  it('should correctly order deltas using fromTokenDeltas helper', () => {
    const tokenA = new Address('0x9000000000000000000000000000000000000000')
    const tokenB = new Address('0x1000000000000000000000000000000000000000')
    const deltaA = 100n
    const deltaB = 200n

    const args = ConcentrateGrowLiquidity2DArgs.fromTokenDeltas(tokenA, tokenB, deltaA, deltaB)

    expect(args.deltaLt).toBe(deltaB)
    expect(args.deltaGt).toBe(deltaA)
  })

  it('should handle normal address ordering correctly', () => {
    const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
    const deltaUSDC = 1000n
    const deltaWETH = 500n

    const args = ConcentrateGrowLiquidity2DArgs.fromTokenDeltas(USDC, WETH, deltaUSDC, deltaWETH)

    expect(args.deltaLt).toBe(deltaUSDC)
    expect(args.deltaGt).toBe(deltaWETH)
  })
})
