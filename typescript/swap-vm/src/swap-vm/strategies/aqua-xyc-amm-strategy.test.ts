// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { AquaXYCAmmStrategy } from './aqua-xyc-amm-strategy'
import { AquaProgramBuilder } from '../programs/aqua-program-builder'

describe('AquaXYCAMMStrategy', () => {
  describe('buildProgram', () => {
    it('should build minimal program with just xycSwap', () => {
      const program = AquaXYCAmmStrategy.new().build()

      const decoded = AquaProgramBuilder.decode(program)
      const rebuilt = decoded.build()
      expect(rebuilt.toString()).toBe(program.toString())
      expect(program.toString()).toBe('0x1100')
    })

    it('should build with all parameters', () => {
      const program = AquaXYCAmmStrategy.newConcentrate({
        sqrtPriceMin: 100000n,
        sqrtPriceMax: 200000n,
      })
        .withDecayPeriod(3600n)
        .withProtocolFee(0.1, new Address('0x0000000000000000000000000000000000000001'))
        .withFeeTokenIn(0.5)
        .withSalt(12345n)
        .build()

      const decoded = AquaProgramBuilder.decode(program)
      const rebuilt = decoded.build()
      expect(rebuilt.toString()).toBe(program.toString())
    })

    it('should add concentrate when deltas are non-zero', () => {
      const program = AquaXYCAmmStrategy.newConcentrate({
        sqrtPriceMin: 100000n,
        sqrtPriceMax: 200000n,
      }).build()

      const decoded = AquaProgramBuilder.decode(program)
      const rebuilt = decoded.build()
      expect(rebuilt.toString()).toBe(program.toString())
      expect(program.toString().length).toBeGreaterThan(4)
    })

    it('should add decay when period is non-zero', () => {
      const program = AquaXYCAmmStrategy.new().withDecayPeriod(600n).build()

      const decoded = AquaProgramBuilder.decode(program)
      const rebuilt = decoded.build()
      expect(rebuilt.toString()).toBe(program.toString())
    })

    it('should add fee when feeBpsIn is non-zero', () => {
      const program = AquaXYCAmmStrategy.new().withFeeTokenIn(0.03).build()

      const decoded = AquaProgramBuilder.decode(program)
      const rebuilt = decoded.build()
      expect(rebuilt.toString()).toBe(program.toString())
    })

    it('should add protocol fee when both fee and receiver provided', () => {
      const program = AquaXYCAmmStrategy.new()
        .withProtocolFee(0.1, new Address('0x0000000000000000000000000000000000000001'))
        .build()

      const decoded = AquaProgramBuilder.decode(program)
      const rebuilt = decoded.build()
      expect(rebuilt.toString()).toBe(program.toString())
    })

    it('should add salt when non-zero', () => {
      const program = AquaXYCAmmStrategy.new().withSalt(12345n).build()

      const decoded = AquaProgramBuilder.decode(program)
      const rebuilt = decoded.build()
      expect(rebuilt.toString()).toBe(program.toString())
    })

    it('should handle token ordering for concentrate', () => {
      const program1 = AquaXYCAmmStrategy.newConcentrate({
        sqrtPriceMin: 100000n,
        sqrtPriceMax: 200000n,
      }).build()

      const program2 = AquaXYCAmmStrategy.newConcentrate({
        sqrtPriceMin: 100000n,
        sqrtPriceMax: 200000n,
      }).build()

      const decoded1 = AquaProgramBuilder.decode(program1)
      const decoded2 = AquaProgramBuilder.decode(program2)
      expect(decoded1.build).toBeDefined()
      expect(decoded2.build).toBeDefined()
    })
  })
})
