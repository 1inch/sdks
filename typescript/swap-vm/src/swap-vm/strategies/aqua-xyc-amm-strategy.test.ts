// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, Bps, Percent } from '@1inch/sdk-core'
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

    it('should build concentrate from raw prices', () => {
      const program = AquaXYCAmmStrategy.newConcentrate({
        rawPriceMin: 10n ** 18n,
        rawPriceMax: 4n * 10n ** 18n,
      }).build()

      expect(AquaProgramBuilder.decode(program).build().toString()).toBe(program.toString())
      expect(program.toString().length).toBeGreaterThan(4)
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

  describe('fees', () => {
    const receiver = new Address('0x0000000000000000000000000000000000000001')
    const receiverHex = '0000000000000000000000000000000000000001'

    it('should build fractional bps fees exactly', () => {
      expect(AquaXYCAmmStrategy.new().withFeeTokenIn(1.1).build().toString()).toBe(
        '0x1504' + '0001adb0' + '1100',
      )
      expect(AquaXYCAmmStrategy.new().withProtocolFee(2.3, receiver).build().toString()).toBe(
        '0x1c18' + '00038270' + receiverHex + '1100',
      )
    })

    it('should build raw fees in fee units', () => {
      expect(AquaXYCAmmStrategy.new().withFeeTokenInRaw(1).build().toString()).toBe(
        '0x1504' + '00000001' + '1100',
      )
      expect(
        AquaXYCAmmStrategy.new().withProtocolFeeRaw(999_999_999, receiver).build().toString(),
      ).toBe('0x1c18' + '3b9ac9ff' + receiverHex + '1100')

      const raw = AquaXYCAmmStrategy.new()
        .withProtocolFeeRaw(Percent.fromScaledBigInt(230000n), receiver)
        .withFeeTokenInRaw(Bps.fromScaledBigInt(110000n))
        .build()
      const bps = AquaXYCAmmStrategy.new()
        .withProtocolFee(2.3, receiver)
        .withFeeTokenIn(1.1)
        .build()

      expect(raw.toString()).toBe(bps.toString())
    })

    it('should use the fee variant that was set last', () => {
      const other = new Address('0x0000000000000000000000000000000000000002')

      expect(
        AquaXYCAmmStrategy.new()
          .withFeeTokenIn(1)
          .withFeeTokenInRaw(5)
          .withProtocolFee(1, receiver)
          .withProtocolFeeRaw(7, other)
          .build()
          .toString(),
      ).toBe(
        AquaXYCAmmStrategy.new()
          .withFeeTokenInRaw(5)
          .withProtocolFeeRaw(7, other)
          .build()
          .toString(),
      )

      expect(
        AquaXYCAmmStrategy.new()
          .withFeeTokenInRaw(5)
          .withFeeTokenIn(1)
          .withProtocolFeeRaw(7, other)
          .withProtocolFee(1, receiver)
          .build()
          .toString(),
      ).toBe(
        AquaXYCAmmStrategy.new().withFeeTokenIn(1).withProtocolFee(1, receiver).build().toString(),
      )
    })

    it('should keep the public fee fields in sync with the setters', () => {
      const strategy = AquaXYCAmmStrategy.new().withFeeTokenIn(1.1).withProtocolFee(2.3, receiver)

      expect(strategy.feeBpsIn).toBe(1.1)
      expect(strategy.protocolFee).toEqual({ bps: 2.3, receiver })

      strategy.withFeeTokenInRaw(5).withProtocolFeeRaw(7, receiver)

      expect(strategy.feeBpsIn).toBe(0.00005)
      expect(strategy.protocolFee).toEqual({ bps: 0.00007, receiver })

      strategy.feeBpsIn = 1.1
      strategy.protocolFee = { bps: 2.3, receiver }

      expect(strategy.build().toString()).toBe(
        AquaXYCAmmStrategy.new()
          .withFeeTokenIn(1.1)
          .withProtocolFee(2.3, receiver)
          .build()
          .toString(),
      )
    })

    it('should skip a zero taker fee', () => {
      expect(AquaXYCAmmStrategy.new().withFeeTokenIn(0).build().toString()).toBe('0x1100')
      expect(AquaXYCAmmStrategy.new().withFeeTokenInRaw(0).build().toString()).toBe('0x1100')
    })

    it('should reject invalid fees in the setters', () => {
      const strategy = AquaXYCAmmStrategy.new()

      expect(() => strategy.withFeeTokenIn(NaN)).toThrow('Must be a finite number')
      expect(() => strategy.withFeeTokenIn(10000.1)).toThrow('Fee out of range')
      expect(() => strategy.withFeeTokenInRaw(-1)).toThrow('Must be a valid uint32')
      expect(() => strategy.withFeeTokenInRaw(1_000_000_001)).toThrow('Fee out of range')
      expect(() => strategy.withProtocolFee(-0.5, receiver)).toThrow('Must be non-negative')
      expect(() => strategy.withProtocolFee(20000, receiver)).toThrow('Fee out of range')
      expect(() => strategy.withProtocolFeeRaw(1_000_000_001, receiver)).toThrow('Fee out of range')

      expect(strategy.feeBpsIn).toBeUndefined()
      expect(strategy.protocolFee).toBeUndefined()
      expect(strategy.build().toString()).toBe('0x1100')
    })
  })
})
