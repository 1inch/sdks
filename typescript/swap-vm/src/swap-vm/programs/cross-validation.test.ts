// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, AddressHalf } from '@1inch/sdk-core'
import { RegularProgramBuilder } from './regular-program-builder'
import { AquaProgramBuilder } from './aqua-program-builder'
import { SwapVmProgram } from '../programs/swap-vm-program'
import type * as balances from '../instructions/balances'
import type * as controls from '../instructions/controls'

describe('Cross-validation with Solidity', () => {
  it('should match Solidity test_PartialFillLimitOrder structure', () => {
    /*
     * @see https://github.com/1inch/swap-vm/blob/main/test/SwapVM.t.sol#L72-L87
     **/
    const tokenA = new Address('0x1111111111111111111111111111111111111111')
    const tokenB = new Address('0x2222222222222222222222222222222222222222')

    const makerBalanceA = 100n * 10n ** 18n
    const makerBalanceB = 200n * 10n ** 18n

    const program = new RegularProgramBuilder()
      .staticBalancesXD({
        tokenBalances: [
          {
            tokenHalf: AddressHalf.fromAddress(tokenA),
            value: makerBalanceA,
          },
          {
            tokenHalf: AddressHalf.fromAddress(tokenB),
            value: makerBalanceB,
          },
        ],
      })
      .limitSwap1D({
        makerDirectionLt: true,
      })
      .invalidateTokenOut1D()
      .salt({ salt: 0x1235n })
      .build()

    const decoded = RegularProgramBuilder.decode(program)
    const instructions = decoded.getInstructions()

    expect(instructions).toHaveLength(4)

    expect(instructions[0].opcode.id.toString()).toContain('staticBalancesXD')
    expect(instructions[1].opcode.id.toString()).toContain('limitSwap1D')
    expect(instructions[2].opcode.id.toString()).toContain('invalidateTokenOut1D')
    expect(instructions[3].opcode.id.toString()).toContain('salt')

    const balancesArgs = instructions[0].args as balances.BalancesArgs
    expect(balancesArgs.tokenBalances).toHaveLength(2)
    expect(balancesArgs.tokenBalances[0].value).toBe(makerBalanceA)
    expect(balancesArgs.tokenBalances[1].value).toBe(makerBalanceB)

    const saltArgs = instructions[3].args as controls.SaltArgs
    expect(saltArgs.salt).toBe(0x1235n)
  })

  it('should encode MinRate instruction correctly for Solidity', () => {
    const program = new RegularProgramBuilder()
      .requireMinRate1D({
        rateLt: 3000n,
        rateGt: 1n,
      })
      .build()

    const decoded = RegularProgramBuilder.decode(program)
    const instructions = decoded.getInstructions()

    expect(instructions).toHaveLength(1)
    expect(instructions[0].opcode.id.toString()).toContain('requireMinRate1D')

    const hex = program.toString()

    const hexBytes = hex.slice(2)
    expect(hexBytes.slice(0, 2)).toBe('1c')
    expect(hexBytes.slice(2, 4)).toBe('10')
    expect(hexBytes.slice(4, 20)).toBe('0000000000000bb8')
    expect(hexBytes.slice(20, 36)).toBe('0000000000000001')
  })

  it('should produce correct encoding for complex program', () => {
    const tokenA = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    const tokenB = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

    const program = new RegularProgramBuilder()
      .staticBalancesXD({
        tokenBalances: [
          {
            tokenHalf: AddressHalf.fromAddress(tokenA),
            value: 1000000n * 10n ** 6n,
          },
          {
            tokenHalf: AddressHalf.fromAddress(tokenB),
            value: 500n * 10n ** 18n,
          },
        ],
      })
      .limitSwap1D({ makerDirectionLt: false })
      .requireMinRate1D({ rateLt: 2000n * 10n ** 6n, rateGt: 10n ** 18n })
      .invalidateTokenOut1D()
      .salt({ salt: 0xdeadbeefn })
      .build()

    const decoded = RegularProgramBuilder.decode(program)
    const instructions = decoded.getInstructions()

    expect(instructions).toHaveLength(5)

    expect(instructions[0].opcode.id.toString()).toContain('staticBalancesXD')
    expect(instructions[1].opcode.id.toString()).toContain('limitSwap1D')
    expect(instructions[2].opcode.id.toString()).toContain('requireMinRate1D')
    expect(instructions[3].opcode.id.toString()).toContain('invalidateTokenOut1D')
    expect(instructions[4].opcode.id.toString()).toContain('salt')

    const rebuilt = decoded.build()
    expect(rebuilt.toString()).toBe(program.toString())
  })

  it('should match exact hex from test_LimitSwapWithTokenOutInvalidator', () => {
    // Exact hex from Solidity test
    const SOLIDITY_HEX =
      '0x1156000296098f7c7019b51a820aec51e99254cd3fb576a90000000000000000000000000000000000000000000000056bc75e2d6310000000000000000000000000000000000000000000000000000ad78ebc5ac62000001a0101150024080000000000001235'

    const decoded = RegularProgramBuilder.decode(new SwapVmProgram(SOLIDITY_HEX))
    const rebuilt = decoded.build()

    expect(rebuilt.toString().toLowerCase()).toBe(SOLIDITY_HEX.toLowerCase())
  })

  it('should match exact hex from test_LimitSwapWithoutInvalidator_ReusableOrder', () => {
    // Exact hex from Solidity test
    const SOLIDITY_HEX =
      '0x1156000296098f7c7019b51a820aec51e99254cd3fb576a90000000000000000000000000000000000000000000000056bc75e2d6310000000000000000000000000000000000000000000000000000ad78ebc5ac62000001a0101'

    const decoded = RegularProgramBuilder.decode(new SwapVmProgram(SOLIDITY_HEX))
    const rebuilt = decoded.build()

    expect(rebuilt.toString().toLowerCase()).toBe(SOLIDITY_HEX.toLowerCase())
  })
})

describe('Cross-validation with Concentrate', () => {
  it('should match exact hex from test_ConcentrateGrowLiquidity_KeepsPriceRangeForBothTokensNoFee', () => {
    // Exact hex from Solidity test
    const SOLIDITY_HEX =
      '0x1256000296098f7c7019b51a820aec51e99254cd3fb576a900000000000000000000000000000000000000000000043c33c19375648000000000000000000000000000000000000000000000000000a2a15d09519be000001840000000000000000000000000000000000000000000000028a857425466f8000000000000000000000000000000000000000000000000007877874945eeb8e38e2504000000001600'

    const decoded = RegularProgramBuilder.decode(new SwapVmProgram(SOLIDITY_HEX))
    const rebuilt = decoded.build()

    expect(rebuilt.toString().toLowerCase()).toBe(SOLIDITY_HEX.toLowerCase())
  })

  it('should build Concentrate program from scratch', () => {
    const tokenA = new Address('0x96098f7c7019b51a820aec51e99254cd3fb576a9')
    const tokenB = new Address('0x0000000000000000000000000000000000000000')
    const balanceA = 20000n * 10n ** 18n
    const balanceB = 3000n * 10n ** 18n

    const program = new RegularProgramBuilder()
      .dynamicBalancesXD({
        tokenBalances: [
          {
            tokenHalf: AddressHalf.fromAddress(tokenA),
            value: balanceA,
          },
          {
            tokenHalf: AddressHalf.fromAddress(tokenB),
            value: balanceB,
          },
        ],
      })
      .concentrateGrowLiquidity2D({
        deltaLt: 200000n,
        deltaGt: 100000n,
      })
      .flatFeeAmountInXD({ fee: 0n })
      .xycSwapXD()
      .build()

    const decoded = RegularProgramBuilder.decode(program)
    const rebuilt = decoded.build()

    expect(rebuilt.toString()).toBe(program.toString())
  })

  it('should match exact hex from test_ConcentrateGrowLiquidity_KeepsPriceRangeForBothTokensWithFee', () => {
    // Exact hex from Solidity test
    const SOLIDITY_HEX =
      '0x1256000296098f7c7019b51a820aec51e99254cd3fb576a900000000000000000000000000000000000000000000043c33c19375648000000000000000000000000000000000000000000000000000a2a15d09519be000001840000000000000000000000000000000000000000000000028a857425466f8000000000000000000000000000000000000000000000000007877874945eeb8e38e2504002dc6c01600'

    const decoded = RegularProgramBuilder.decode(new SwapVmProgram(SOLIDITY_HEX))
    const rebuilt = decoded.build()

    expect(rebuilt.toString().toLowerCase()).toBe(SOLIDITY_HEX.toLowerCase())
  })
})

describe('Cross-validation with Aqua Solidity', () => {
  it('should match exact hex from test_XYCSwap (using Regular opcodes)', () => {
    // Exact hex from Solidity test
    const SOLIDITY_HEX = '0x1600'

    const decoded = RegularProgramBuilder.decode(new SwapVmProgram(SOLIDITY_HEX))
    const rebuilt = decoded.build()

    expect(rebuilt.toString().toLowerCase()).toBe(SOLIDITY_HEX.toLowerCase())
  })

  it('should build simple XYCSwap program using regular builder', () => {
    const program = new RegularProgramBuilder().xycSwapXD().build()

    expect(program.toString()).toBe('0x1600')
  })

  it('should handle AquaProgramBuilder encoding/decoding', () => {
    const program = new AquaProgramBuilder()
      .decayXD({ decayPeriod: 3600n })
      .xycSwapXD()
      .salt({ salt: 0x1234n })
      .flatFeeAmountInXD({ fee: 300n })
      .build()

    const decoded = AquaProgramBuilder.decode(program)
    const rebuilt = decoded.build()

    expect(rebuilt.toString()).toBe(program.toString())
  })
})
