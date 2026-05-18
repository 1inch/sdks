// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { AquaXYCAmmStrategy } from './aqua-xyc-amm-strategy'
import { AquaProgramBuilder } from '../programs/aqua-program-builder'

describe('AquaXycAmmStrategy Examples', () => {
  it('Example: Minimal AMM', () => {
    const program = AquaXYCAmmStrategy.new().build()

    expect(program.toString()).toBe('0x1100')
  })

  it('Example: AMM with fee', () => {
    const program = AquaXYCAmmStrategy.new().withFeeTokenIn(0.00003).build()

    const flatFeeInInstructionIndex = 21

    const hex = program.toString()
    expect(hex).toContain(flatFeeInInstructionIndex.toString(16))
    expect(hex).toContain('10')
  })

  it('Example: Concentrated liquidity', () => {
    const program = AquaXYCAmmStrategy.newConcentrate({
      sqrtPriceMin: 100000n,
      sqrtPriceMax: 200000n,
    })
      .withFeeTokenIn(0.05)
      .build()

    const decoded = AquaProgramBuilder.decode(program)
    expect(decoded.build().toString()).toBe(program.toString())
  })

  it('Example: MEV-protected with decay', () => {
    const program = AquaXYCAmmStrategy.new().withFeeTokenIn(0.03).withDecayPeriod(600n).build()

    const decoded = AquaProgramBuilder.decode(program)
    expect(decoded.build().toString()).toBe(program.toString())
  })

  it('Example: Full configuration', () => {
    const program = AquaXYCAmmStrategy.newConcentrate({
      sqrtPriceMin: 50000n,
      sqrtPriceMax: 100000n,
    })
      .withProtocolFee(0.00001, new Address('0x0000000000000000000000000000000000000001'))
      .withFeeTokenIn(3)
      .withDecayPeriod(3600n)
      .withSalt(12345n)
      .build()

    const decoded = AquaProgramBuilder.decode(program)
    expect(decoded.build().toString()).toBe(program.toString())
  })
})
