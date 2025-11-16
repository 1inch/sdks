// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { AquaAMMStrategy } from './aqua-amm-strategy'
import { AquaProgramBuilder } from '../programs/aqua-program-builder'

describe('AquaAMMStrategy Examples', () => {
  const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
  const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

  it('Example: Minimal AMM', () => {
    const program = AquaAMMStrategy.new({
      tokenA: USDC,
      tokenB: WETH,
    }).build()

    expect(program.toString()).toBe('0x1100')
  })

  it('Example: AMM with fee', () => {
    const program = AquaAMMStrategy.new({
      tokenA: USDC,
      tokenB: WETH,
    })
      .withFeeTokenIn(0.00003)
      .build()

    const hex = program.toString()
    expect(hex).toContain('16')
    expect(hex).toContain('10')
  })

  it('Example: Concentrated liquidity', () => {
    const program = AquaAMMStrategy.new({
      tokenA: USDC,
      tokenB: WETH,
    })
      .withDeltas(100000n, 200000n)
      .withFeeTokenIn(0.05)
      .build()

    const decoded = AquaProgramBuilder.decode(program)
    expect(decoded.build().toString()).toBe(program.toString())
  })

  it('Example: MEV-protected with decay', () => {
    const program = AquaAMMStrategy.new({
      tokenA: USDC,
      tokenB: WETH,
    })
      .withFeeTokenIn(0.03)
      .withDecayPeriod(600n)
      .build()

    const decoded = AquaProgramBuilder.decode(program)
    expect(decoded.build().toString()).toBe(program.toString())
  })

  it('Example: Full configuration', () => {
    const program = AquaAMMStrategy.new({
      tokenA: USDC,
      tokenB: WETH,
    })
      .withProtocolFee(0.00001, new Address('0x0000000000000000000000000000000000000001'))
      .withFeeTokenIn(3)
      .withDeltas(50000n, 100000n)
      .withDecayPeriod(3600n)
      .withSalt(12345n)
      .build()

    const decoded = AquaProgramBuilder.decode(program)
    expect(decoded.build().toString()).toBe(program.toString())
  })
})
