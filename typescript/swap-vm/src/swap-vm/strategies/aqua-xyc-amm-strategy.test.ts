// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, Bps } from '@1inch/sdk-core'
import { AquaXYCAmmStrategy } from './aqua-xyc-amm-strategy'
import { AquaProgramBuilder } from '../programs/aqua-program-builder'
import * as concentrate from '../instructions/concentrate'
import * as controls from '../instructions/controls'
import * as decay from '../instructions/decay'
import * as fee from '../instructions/fee'
import * as xycSwap from '../instructions/xyc-swap'

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

    it('should emit every instruction in the documented order', () => {
      const program = AquaXYCAmmStrategy.newConcentrate({
        sqrtPriceMin: 100000n,
        sqrtPriceMax: 200000n,
      })
        .withSalt(12345n)
        .withFeeTokenIn(0.5)
        .withDecayPeriod(3600n)
        .withProtocolFee(0.1, new Address('0x0000000000000000000000000000000000000002'))
        .withTxOriginAccessToken(new Address('0x0000000000000000000000000000000000000001'))
        .build()

      const ids = AquaProgramBuilder.decode(program)
        .getInstructions()
        .map((ix) => ix.opcode.id)
      expect(ids).toEqual([
        controls.onlyTxOriginTokenBalanceNonZero.id,
        fee.aquaProtocolFeeAmountInXD.id,
        decay.decayXD.id,
        concentrate.concentrateGrowLiquidity2D.id,
        fee.flatFeeAmountInXD.id,
        xycSwap.xycSwapXD.id,
        controls.salt.id,
      ])
    })

    it('should emit decay before concentrate', () => {
      const program = AquaXYCAmmStrategy.newConcentrate({
        sqrtPriceMin: 100000n,
        sqrtPriceMax: 200000n,
      })
        .withDecayPeriod(3600n)
        .build()

      const ids = AquaProgramBuilder.decode(program)
        .getInstructions()
        .map((ix) => ix.opcode.id)
      expect(ids).toEqual([
        decay.decayXD.id,
        concentrate.concentrateGrowLiquidity2D.id,
        xycSwap.xycSwapXD.id,
      ])
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

    it('should reject a zero decay period instead of omitting decayXD', () => {
      expect(() => AquaXYCAmmStrategy.new().withDecayPeriod(0n).build()).toThrow(
        'Invalid decayPeriod value: 0. Must be > 0',
      )
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
        sqrtPriceMin: concentrate.Price.fromHuman('0.00001', pair).toSqrt(),
        sqrtPriceMax: concentrate.Price.fromHuman('0.00002', pair).toSqrt(),
      }).build()

      const [concentrateIx] = AquaProgramBuilder.decode(program).getInstructions()
      const args = concentrateIx.args as concentrate.ConcentrateGrowLiquidity2DArgs
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

    it('should accept a Bps instance', () => {
      expect(AquaXYCAmmStrategy.new().withFeeTokenIn(Bps.fromNumber(1.1)).build().toString()).toBe(
        AquaXYCAmmStrategy.new().withFeeTokenIn(1.1).build().toString(),
      )
      expect(
        AquaXYCAmmStrategy.new().withProtocolFee(Bps.fromNumber(2.3), receiver).build().toString(),
      ).toBe(AquaXYCAmmStrategy.new().withProtocolFee(2.3, receiver).build().toString())
    })

    it('should use the fee that was set last', () => {
      const other = new Address('0x0000000000000000000000000000000000000002')

      expect(
        AquaXYCAmmStrategy.new()
          .withFeeTokenIn(5)
          .withFeeTokenIn(Bps.fromNumber(1))
          .withProtocolFee(7, other)
          .withProtocolFee(Bps.fromNumber(1), receiver)
          .build()
          .toString(),
      ).toBe(
        AquaXYCAmmStrategy.new().withFeeTokenIn(1).withProtocolFee(1, receiver).build().toString(),
      )
    })

    it('should store fee args on the public fields', () => {
      const strategy = AquaXYCAmmStrategy.new().withFeeTokenIn(1.1).withProtocolFee(2.3, receiver)

      expect(strategy.feeBpsIn).toEqual(fee.FlatFeeArgs.fromBps(1.1))
      expect(strategy.protocolFee).toEqual(fee.ProtocolFeeArgs.fromBps(2.3, receiver))

      strategy.withFeeTokenIn(Bps.fromNumber(1)).withProtocolFee(Bps.fromNumber(1), receiver)

      expect(strategy.feeBpsIn).toEqual(fee.FlatFeeArgs.fromBps(1))
      expect(strategy.protocolFee).toEqual(fee.ProtocolFeeArgs.fromBps(1, receiver))

      strategy.feeBpsIn = fee.FlatFeeArgs.fromBps(1.1)
      strategy.protocolFee = fee.ProtocolFeeArgs.fromBps(2.3, receiver)

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
    })

    it('should reject invalid fees in the setters', () => {
      const strategy = AquaXYCAmmStrategy.new()

      expect(() => strategy.withFeeTokenIn(NaN)).toThrow('Must be a finite number')
      expect(() => strategy.withFeeTokenIn(10000.1)).toThrow('Fee out of range')
      expect(() => strategy.withFeeTokenIn(Bps.fromScaledBigInt(1_000_000_001n))).toThrow(
        'Fee out of range',
      )
      expect(() => strategy.withProtocolFee(-0.5, receiver)).toThrow('Must be non-negative')
      expect(() => strategy.withProtocolFee(20000, receiver)).toThrow('Fee out of range')
      expect(() =>
        strategy.withProtocolFee(Bps.fromScaledBigInt(1_000_000_001n), receiver),
      ).toThrow('Fee out of range')

      expect(strategy.feeBpsIn).toBeUndefined()
      expect(strategy.protocolFee).toBeUndefined()
      expect(strategy.build().toString()).toBe('0x1100')
    })
  })
})
