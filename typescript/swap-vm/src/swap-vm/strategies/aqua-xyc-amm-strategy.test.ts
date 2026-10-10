// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { AquaXYCAmmStrategy } from './aqua-xyc-amm-strategy'
import { AquaProgramBuilder } from '../programs/aqua-program-builder'
import type { ConcentrateGrowLiquidity2DArgs } from '../instructions/concentrate'
import { Price } from '../instructions/concentrate'

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

    it('should build concentrate from raw prices', () => {
      const program = AquaXYCAmmStrategy.newConcentrate({
        rawPriceMin: 10n ** 18n,
        rawPriceMax: 4n * 10n ** 18n,
      }).build()

      expect(AquaProgramBuilder.decode(program).build().toString()).toBe(program.toString())
      expect(program.toString().length).toBeGreaterThan(4)
    })

    it('should reject raw prices too small for 1e18 fixed-point', () => {
      expect(() =>
        AquaXYCAmmStrategy.newConcentrate({ rawPriceMin: 9n, rawPriceMax: 19n }),
      ).toThrow(
        'Invalid rawPriceMin: 9. Must be >= 100000 for 1e-5 precision; use sqrt prices instead',
      )
    })

    it('should encode the exact sqrt bounds of Price.toSqrt()', () => {
      const pair = {
        quoteToken: {
          address: new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'), // USDC
          decimals: 6n,
        },
        baseToken: {
          address: new Address('0x6982508145454Ce325dDbE47a25d4ec3d2311933'), // PEPE
          decimals: 18n,
        },
      }
      const program = AquaXYCAmmStrategy.newConcentrate({
        sqrtPriceMin: Price.fromHuman('0.00001', pair).toSqrt(),
        sqrtPriceMax: Price.fromHuman('0.00002', pair).toSqrt(),
      }).build()

      const [concentrateIx] = AquaProgramBuilder.decode(program).getInstructions()
      const args = concentrateIx.args as ConcentrateGrowLiquidity2DArgs
      // 0.00001 USDC per PEPE is P = 10 in 1e18 fixed-point: floor(sqrt(10 * 1e18))
      expect(args.sqrtPriceMin).toBe(3162277660n)
      expect(args.sqrtPriceMax).toBe(4472135954n)
    })

    it('should include a tx.origin access token', () => {
      const access = new Address('0x0000000000000000000000000000000000000001')
      const program = AquaXYCAmmStrategy.new().withTxOriginAccessToken(access).build()

      expect(AquaProgramBuilder.decode(program).build().toString()).toBe(program.toString())
      expect(program.toString().length).toBeGreaterThan(
        AquaXYCAmmStrategy.new().build().toString().length,
      )
    })

    it('should reject unknown concentrate parameters', () => {
      expect(() =>
        AquaXYCAmmStrategy.newConcentrate({} as { sqrtPriceMin: bigint; sqrtPriceMax: bigint }),
      ).toThrow('unknown parameters for newXYCConcentrate')
    })
  })
})
