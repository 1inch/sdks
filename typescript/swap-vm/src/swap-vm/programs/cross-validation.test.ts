// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { RegularProgramBuilder } from './regular-program-builder'
import { AquaProgramBuilder } from './aqua-program-builder'
import { SwapVmProgram } from '../programs/swap-vm-program'
import type * as balances from '../instructions/balances'
import type * as controls from '../instructions/controls'
import type * as limitSwap from '../instructions/limit-swap'

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
            token: tokenA,
            value: makerBalanceA,
          },
          {
            token: tokenB,
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
    expect(balancesArgs.tokenBalances[0].token.toString()).toBe(tokenA.toString())
    expect(balancesArgs.tokenBalances[0].value).toBe(makerBalanceA)
    expect(balancesArgs.tokenBalances[1].token.toString()).toBe(tokenB.toString())
    expect(balancesArgs.tokenBalances[1].value).toBe(makerBalanceB)

    const saltArgs = instructions[3].args as controls.SaltArgs
    expect(saltArgs.salt).toBe(0x1235n)
  })

  it('should match exact staticBalancesXD and dynamicBalancesXD bytes from BalancesArgsBuilder', () => {
    const tokenA = new Address('0x1111111111111111111111111111111111111111')
    const tokenB = new Address('0x2222222222222222222222222222222222222222')
    const tokenBalances = [
      { token: tokenA, value: 100n * 10n ** 18n },
      { token: tokenB, value: 200n * 10n ** 18n },
    ]

    // BalancesArgsBuilder.build([0x11..11, 0x22..22], [100e18, 200e18]), 106 (0x6a) bytes
    const BALANCES_ARGS_HEX =
      '0002' +
      '11'.repeat(20) +
      '22'.repeat(20) +
      '0000000000000000000000000000000000000000000000056bc75e2d63100000' +
      '00000000000000000000000000000000000000000000000ad78ebc5ac6200000'

    const staticProgram = new RegularProgramBuilder().staticBalancesXD({ tokenBalances }).build()
    const dynamicProgram = new RegularProgramBuilder().dynamicBalancesXD({ tokenBalances }).build()

    expect(staticProgram.toString()).toBe('0x116a' + BALANCES_ARGS_HEX)
    expect(dynamicProgram.toString()).toBe('0x126a' + BALANCES_ARGS_HEX)
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
    expect(hexBytes.slice(0, 2)).toBe('1b')
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
            token: tokenA,
            value: 1000000n * 10n ** 6n,
          },
          {
            token: tokenB,
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

  it('should match exact hex from test_LimitSwapWithoutInvalidator_ReusableOrder', () => {
    // Program of the Solidity test built with the on-chain builders:
    // staticBalancesXD(BalancesArgsBuilder.build([tokenA, tokenB], [100e18, 200e18]))
    // limitSwap1D(LimitSwapArgsBuilder.build(tokenB, tokenA))
    const SOLIDITY_HEX =
      '0x116a0002f62849f9a0b5bf2913b396098f7c7019b51a820a5991a2df15a8f6a256d3ec51e99254cd3fb576a90000000000000000000000000000000000000000000000056bc75e2d6310000000000000000000000000000000000000000000000000000ad78ebc5ac6200000190101'
    const tokenA = new Address('0xF62849F9A0B5Bf2913b396098F7c7019b51A820a')
    const tokenB = new Address('0x5991A2dF15A8F6A256D3Ec51E99254Cd3fb576A9')

    const decoded = RegularProgramBuilder.decode(new SwapVmProgram(SOLIDITY_HEX))
    const rebuilt = decoded.build()

    expect(rebuilt.toString().toLowerCase()).toBe(SOLIDITY_HEX.toLowerCase())

    const [balancesIx, limitSwapIx] = decoded.getInstructions()
    expect(balancesIx.opcode.id.toString()).toContain('staticBalancesXD')
    expect((balancesIx.args as balances.BalancesArgs).tokenBalances).toEqual([
      { token: tokenA, value: 100n * 10n ** 18n },
      { token: tokenB, value: 200n * 10n ** 18n },
    ])
    expect(limitSwapIx.opcode.id.toString()).toContain('limitSwap1D')
    expect((limitSwapIx.args as limitSwap.LimitSwapDirectionArgs).makerDirectionLt).toBe(true)

    const built = new RegularProgramBuilder()
      .staticBalancesXD({
        tokenBalances: [
          { token: tokenA, value: 100n * 10n ** 18n },
          { token: tokenB, value: 200n * 10n ** 18n },
        ],
      })
      .limitSwap1D({ makerDirectionLt: tokenB.lt(tokenA) })
      .build()

    expect(built.toString()).toBe(SOLIDITY_HEX)
  })
})

describe('Cross-validation with Concentrate', () => {
  it('should build Concentrate program from scratch', () => {
    const tokenA = new Address('0x96098f7c7019b51a820aec51e99254cd3fb576a9')
    const tokenB = new Address('0x0000000000000000000000000000000000000000')
    const balanceA = 20000n * 10n ** 18n
    const balanceB = 3000n * 10n ** 18n

    const program = new RegularProgramBuilder()
      .dynamicBalancesXD({
        tokenBalances: [
          {
            token: tokenA,
            value: balanceA,
          },
          {
            token: tokenB,
            value: balanceB,
          },
        ],
      })
      .concentrateGrowLiquidity2D({
        sqrtPriceMax: 200000n,
        sqrtPriceMin: 100000n,
      })
      .flatFeeAmountInXD({ fee: 0n })
      .xycSwapXD()
      .build()

    const decoded = RegularProgramBuilder.decode(program)
    const rebuilt = decoded.build()

    expect(rebuilt.toString()).toBe(program.toString())
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
