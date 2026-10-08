// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { AquaProgramBuilder } from './aqua-program-builder'
import { SwapVmProgram } from './swap-vm-program'
import { PeggedSwapArgs } from '../instructions/pegged-swap'
import type { JumpIfTokenArgs } from '../instructions/controls'
import type { ProtocolFeeArgs } from '../instructions/fee'

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

  it('should apply instruction args validation when decoding programs', () => {
    const valid = new AquaProgramBuilder()
      .decayXD({ decayPeriod: 3600n })
      .aquaProtocolFeeAmountInXD({ fee: 100000n, to: RECEIVER })
      .build()

    // decayXD (0x13) | aquaProtocolFeeAmountInXD (0x1c)
    expect(valid.toString()).toBe(
      '0x13020e10' + '1c18' + '000186a0' + '0000000000000000000000000000000000000001',
    )

    expect(() => AquaProgramBuilder.decode(new SwapVmProgram('0x13020000'))).toThrow(
      'Invalid decayPeriod value: 0',
    )
    expect(() =>
      AquaProgramBuilder.decode(new SwapVmProgram('0x1c18' + '000186a0' + '00'.repeat(20))),
    ).toThrow('Invalid fee recipient (to). Must be non zero address when fee > 0')
  })

  it('should accept a zero protocol fee without a recipient', () => {
    const program = new AquaProgramBuilder()
      .aquaProtocolFeeAmountInXD({ fee: 0n, to: Address.ZERO_ADDRESS })
      .build()

    // aquaProtocolFeeAmountInXD (0x1c)
    expect(program.toString()).toBe('0x1c18' + '00000000' + '00'.repeat(20))

    const decoded = AquaProgramBuilder.decode(program)
    expect(decoded.build().toString()).toBe(program.toString())

    const args = decoded.getInstructions()[0].args as ProtocolFeeArgs
    expect(args.fee).toBe(0n)
    expect(args.to.isZero()).toBe(true)
  })
})
