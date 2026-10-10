// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { AquaPeggedAmmStrategy } from './aqua-pegged-amm-strategy'
import { AquaProgramBuilder } from '../programs/aqua-program-builder'
import type { SwapVmProgram } from '../programs'
import * as fee from '../instructions/fee'

const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const DAI = new Address('0x6B175474E89094C44Da98b954EedeAC495271d0F')
const ACCESS = new Address('0x0000000000000000000000000000000000000001')
const RECEIVER = new Address('0x0000000000000000000000000000000000000002')
const LINEAR_WIDTH = 8n * 10n ** 26n

describe('AquaPeggedAmmStrategy', () => {
  const tokenA = { address: USDC, decimals: 6, reserve: 1_000_000n * 10n ** 6n }
  const tokenB = { address: DAI, decimals: 18, reserve: 1_000_000n * 10n ** 18n }

  it('should build a program that round-trips through AquaProgramBuilder', () => {
    const program = AquaPeggedAmmStrategy.new({
      tokenA,
      tokenB,
      linearWidth: LINEAR_WIDTH,
    }).build()

    const rebuilt = AquaProgramBuilder.decode(program).build()

    expect(rebuilt.toString()).toBe(program.toString())
    expect(program.toString().startsWith('0x')).toBe(true)
    expect(program.toString().length).toBeGreaterThan(4)
  })

  it('should include optional access token, fees, decay and salt', () => {
    const program = AquaPeggedAmmStrategy.new({
      tokenA,
      tokenB,
      linearWidth: LINEAR_WIDTH,
    })
      .withTxOriginAccessToken(ACCESS)
      .withProtocolFee(0.1, RECEIVER)
      .withDecayPeriod(3600n)
      .withFeeTokenIn(1)
      .withSalt(99n)
      .build()

    const rebuilt = AquaProgramBuilder.decode(program).build()

    expect(rebuilt.toString()).toBe(program.toString())
    expect(program.toString().length).toBeGreaterThan(
      AquaPeggedAmmStrategy.new({ tokenA, tokenB, linearWidth: LINEAR_WIDTH }).build().toString()
        .length,
    )
  })

  describe('fees', () => {
    const newStrategy = (): AquaPeggedAmmStrategy =>
      AquaPeggedAmmStrategy.new({ tokenA, tokenB, linearWidth: LINEAR_WIDTH })

    const feeArgs = (
      program: SwapVmProgram,
    ): { flatFee?: fee.FlatFeeArgs; protocolFee?: fee.ProtocolFeeArgs } => {
      const ixs = AquaProgramBuilder.decode(program).getInstructions()

      return {
        flatFee: ixs.find((ix) => ix.opcode.id === fee.flatFeeAmountInXD.id)?.args as
          | fee.FlatFeeArgs
          | undefined,
        protocolFee: ixs.find((ix) => ix.opcode.id === fee.aquaProtocolFeeAmountInXD.id)?.args as
          | fee.ProtocolFeeArgs
          | undefined,
      }
    }

    it('should build fractional bps fees exactly', () => {
      const program = newStrategy().withProtocolFee(2.3, RECEIVER).withFeeTokenIn(1.1).build()
      const { flatFee, protocolFee } = feeArgs(program)

      expect(flatFee?.fee).toBe(110000n)
      expect(protocolFee?.fee).toBe(230000n)
      expect(protocolFee?.to.toString()).toBe(RECEIVER.toString())
      expect(program.toString()).toContain('1504' + '0001adb0')
    })

    it('should build raw fees in fee units', () => {
      const raw = newStrategy().withProtocolFeeRaw(1n, RECEIVER).withFeeTokenInRaw(2n).build()
      const { flatFee, protocolFee } = feeArgs(raw)

      expect(flatFee?.fee).toBe(2n)
      expect(protocolFee?.fee).toBe(1n)
      expect(protocolFee?.to.toString()).toBe(RECEIVER.toString())

      expect(
        newStrategy()
          .withProtocolFeeRaw(230000n, RECEIVER)
          .withFeeTokenInRaw(110000n)
          .build()
          .toString(),
      ).toBe(newStrategy().withProtocolFee(2.3, RECEIVER).withFeeTokenIn(1.1).build().toString())
    })

    it('should use the fee variant that was set last', () => {
      const lastRaw = feeArgs(
        newStrategy()
          .withFeeTokenIn(1)
          .withFeeTokenInRaw(5n)
          .withProtocolFee(1, ACCESS)
          .withProtocolFeeRaw(7n, RECEIVER)
          .build(),
      )

      expect(lastRaw.flatFee?.fee).toBe(5n)
      expect(lastRaw.protocolFee?.fee).toBe(7n)
      expect(lastRaw.protocolFee?.to.toString()).toBe(RECEIVER.toString())

      const lastBps = feeArgs(
        newStrategy()
          .withFeeTokenInRaw(5n)
          .withFeeTokenIn(1)
          .withProtocolFeeRaw(7n, RECEIVER)
          .withProtocolFee(1, ACCESS)
          .build(),
      )

      expect(lastBps.flatFee?.fee).toBe(100000n)
      expect(lastBps.protocolFee?.fee).toBe(100000n)
      expect(lastBps.protocolFee?.to.toString()).toBe(ACCESS.toString())
    })

    it('should reject invalid fees in the setters', () => {
      const strategy = newStrategy()

      expect(() => strategy.withFeeTokenIn(2.345678)).toThrow('Must be a multiple of 0.00001 bps')
      expect(() => strategy.withFeeTokenInRaw(1_000_000_001n)).toThrow('Fee out of range')
      expect(() => strategy.withProtocolFee(Infinity, RECEIVER)).toThrow('Must be a finite number')
      expect(() => strategy.withProtocolFeeRaw(-1n, RECEIVER)).toThrow('Must be a valid uint32')

      expect(feeArgs(strategy.build())).toEqual({ flatFee: undefined, protocolFee: undefined })
    })
  })
})
