// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, HexString } from '@1inch/sdk-core'
import { AquaProgramBuilder } from './aqua-program-builder'
import { SwapVmProgram } from './swap-vm-program'
import { PeggedSwapArgs } from '../instructions/pegged-swap'
import { extruction, ExtructionArgs } from '../instructions/extruction'
import type { JumpIfTokenArgs } from '../instructions/controls'
import type * as controls from '../instructions/controls'

const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
const RECEIVER = new Address('0x0000000000000000000000000000000000000001')
const LINEAR_WIDTH = 8n * 10n ** 26n

describe('AquaProgramBuilder', () => {
  it('should encode and decode the full aqua instruction set helpers', () => {
    const pegged = PeggedSwapArgs.fromTokens(
      { address: USDC, decimals: 6, reserve: 1_000_000n * 10n ** 6n },
      { address: WETH, decimals: 18, reserve: 500n * 10n ** 18n },
      LINEAR_WIDTH,
    )

    const program = new AquaProgramBuilder()
      .jump({ nextPC: 5n })
      .jumpIfTokenIn({ token: USDC, nextPC: 6n })
      .jumpIfTokenOut({ token: WETH, nextPC: 7n })
      .deadline({ deadline: 1735689600n })
      .onlyTakerTokenBalanceNonZero({ token: USDC })
      .onlyTakerTokenBalanceGte({ token: USDC, minAmount: 1n })
      .onlyTakerTokenSupplyShareGte({ token: USDC, minShareE18: 10n ** 15n })
      .onlyTxOriginTokenBalanceNonZero({ token: WETH })
      .xycSwapXD()
      .concentrateGrowLiquidity2D({
        sqrtPriceMin: 9n * 10n ** 17n,
        sqrtPriceMax: 11n * 10n ** 17n,
      })
      .decayXD({ decayPeriod: 3600n })
      .salt({ salt: 42n })
      .flatFeeAmountInXD({ fee: 100000n })
      .protocolFeeAmountInXD({ fee: 100000n, to: RECEIVER })
      .aquaProtocolFeeAmountInXD({ fee: 100000n, to: RECEIVER })
      .dynamicProtocolFeeAmountInXD({ feeProvider: RECEIVER })
      .aquaDynamicProtocolFeeAmountInXD({ feeProvider: RECEIVER })
      .peggedSwapGrowPriceRange2D(pegged)
      .build()

    const decoded = AquaProgramBuilder.decode(program)

    expect(decoded.build().toString()).toBe(program.toString())
    expect(decoded.getInstructions()).toHaveLength(18)
  })

  describe('salt', () => {
    it.each([
      ['0 bytes', '0x', '0x1400'],
      ['4 bytes', '0xdeadbeef', '0x1404deadbeef'],
      ['8 bytes', '0x0102030405060708', '0x14080102030405060708'],
      ['32 bytes', '0x' + 'ab'.repeat(32), '0x1420' + 'ab'.repeat(32)],
    ])('should decode and rebuild a salt of %s byte-identically', (_name, salt, programHex) => {
      const decoded = AquaProgramBuilder.decode(new SwapVmProgram(programHex))
      const saltArgs = decoded.getInstructions()[0].args as controls.SaltArgs
      const built = new AquaProgramBuilder().salt({ salt: new HexString(salt) }).build()

      expect(decoded.build().toString()).toBe(programHex)
      expect(saltArgs.bytes.toString()).toBe(salt)
      expect(built.toString()).toBe(programHex)
    })

    it('should decode variable-length salts between other instructions', () => {
      const program = new AquaProgramBuilder()
        .xycSwapXD()
        .salt({ salt: new HexString('0x' + 'ab'.repeat(32)) })
        .salt({ salt: HexString.EMPTY })
        .flatFeeAmountInXD({ fee: 300n })
        .build()

      const decoded = AquaProgramBuilder.decode(program)

      expect(decoded.build().toString()).toBe(program.toString())
      expect(decoded.getInstructions()).toHaveLength(4)
    })

    it('should encode a bigint salt as 8 bytes', () => {
      expect(new AquaProgramBuilder().salt({ salt: 42n }).build().toString()).toBe(
        '0x1408000000000000002a',
      )
    })
  })

  it('should encode and decode extruction with empty args', () => {
    const target = new Address('0x1111111111111111111111111111111111111111')
    const expected = `0x2014${target.toString().slice(2)}`

    const program = new AquaProgramBuilder()
      .add(extruction.createIx(new ExtructionArgs(target, HexString.EMPTY)))
      .build()

    expect(program.toString()).toBe(expected)

    const decoded = AquaProgramBuilder.decode(new SwapVmProgram(expected))
    const [ix] = decoded.getInstructions()

    expect(decoded.build().toString()).toBe(expected)
    expect(ix.opcode).toBe(extruction)
    expect((ix.args as ExtructionArgs).extructionArgs.isEmpty()).toBe(true)
  })

  it('should encode jumpIfTokenIn and jumpIfTokenOut with full token addresses', () => {
    const program = new AquaProgramBuilder()
      .jumpIfTokenIn({ token: USDC, nextPC: 6n })
      .jumpIfTokenOut({ token: WETH, nextPC: 7n })
      .build()

    // AquaOpcodes Controls._jumpIfTokenIn / _jumpIfTokenOut with ControlsArgsBuilder.buildJumpIfToken args
    expect(program.toString()).toBe(
      '0x0b16a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480006' +
        '0c16c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20007',
    )

    const [jumpIn, jumpOut] = AquaProgramBuilder.decode(program).getInstructions()
    expect((jumpIn.args as JumpIfTokenArgs).token.equal(USDC)).toBe(true)
    expect((jumpIn.args as JumpIfTokenArgs).nextPC).toBe(6n)
    expect((jumpOut.args as JumpIfTokenArgs).token.equal(WETH)).toBe(true)
    expect((jumpOut.args as JumpIfTokenArgs).nextPC).toBe(7n)
  })
})
