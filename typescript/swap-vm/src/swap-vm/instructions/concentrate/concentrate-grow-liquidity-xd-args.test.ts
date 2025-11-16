// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, AddressHalf } from '@1inch/sdk-core'
import { ConcentrateGrowLiquidityXDArgs } from './concentrate-grow-liquidity-xd-args'
import { ConcentrateGrowLiquidityXDArgsCoder } from './concentrate-grow-liquidity-xd-args-coder'

describe('ConcentrateGrowLiquidityXDArgs', () => {
  const coder = new ConcentrateGrowLiquidityXDArgsCoder()
  const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
  const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
  const USDC_HALF = AddressHalf.fromAddress(USDC)
  const WETH_HALF = AddressHalf.fromAddress(WETH)

  it('should encode and decode token deltas', () => {
    const args = new ConcentrateGrowLiquidityXDArgs([
      { tokenHalf: USDC_HALF, delta: 1000n * 10n ** 18n },
      { tokenHalf: WETH_HALF, delta: 5n * 10n ** 18n },
    ])

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.tokenDeltas).toHaveLength(2)
    expect(decoded.tokenDeltas[0].tokenHalf.toString()).toBe(USDC_HALF.toString())
    expect(decoded.tokenDeltas[0].delta).toBe(1000n * 10n ** 18n)
    expect(decoded.tokenDeltas[1].tokenHalf.toString()).toBe(WETH_HALF.toString())
    expect(decoded.tokenDeltas[1].delta).toBe(5n * 10n ** 18n)
  })

  it('should handle single token delta', () => {
    const args = new ConcentrateGrowLiquidityXDArgs([
      { tokenHalf: USDC_HALF, delta: 50n * 10n ** 18n },
    ])

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.tokenDeltas).toHaveLength(1)
    expect(decoded.tokenDeltas[0].tokenHalf.toString()).toBe(USDC_HALF.toString())
    expect(decoded.tokenDeltas[0].delta).toBe(50n * 10n ** 18n)
  })

  it('should handle empty deltas array', () => {
    const args = new ConcentrateGrowLiquidityXDArgs([])

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.tokenDeltas).toHaveLength(0)
  })

  it('should use static decode method', () => {
    const args = new ConcentrateGrowLiquidityXDArgs([{ tokenHalf: WETH_HALF, delta: 100n }])
    const encoded = coder.encode(args)

    const decoded = ConcentrateGrowLiquidityXDArgs.decode(encoded)
    expect(decoded.tokenDeltas).toHaveLength(1)
    expect(decoded.tokenDeltas[0].delta).toBe(100n)
  })

  it('should convert to JSON', () => {
    const args = new ConcentrateGrowLiquidityXDArgs([{ tokenHalf: USDC_HALF, delta: 42n }])
    const json = args.toJSON()

    expect(json).toEqual({
      tokenDeltas: [
        {
          token: USDC_HALF.toString(),
          delta: '42',
        },
      ],
    })
  })
})
