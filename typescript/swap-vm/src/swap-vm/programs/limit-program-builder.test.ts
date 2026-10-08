// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { trim0x } from '@1inch/byte-utils'
import { Address, AddressHalf, HexString } from '@1inch/sdk-core'
import { LimitProgramBuilder } from './limit-program-builder'
import { RegularProgramBuilder } from './regular-program-builder'
import { SwapVmProgram } from './swap-vm-program'
import { limitInstructions } from '../instructions'
import type { IInstruction, IOpcode } from '../instructions'
import { EMPTY_OPCODE } from '../instructions/empty'
import * as balances from '../instructions/balances'
import * as controls from '../instructions/controls'
import * as invalidators from '../instructions/invalidators'
import * as xycSwap from '../instructions/xyc-swap'
import * as concentrate from '../instructions/concentrate'
import * as decay from '../instructions/decay'
import * as peggedSwap from '../instructions/pegged-swap'
import * as limitSwap from '../instructions/limit-swap'
import * as minRate from '../instructions/min-rate'
import * as dutchAuction from '../instructions/dutch-auction'
import * as baseFeeAdjuster from '../instructions/base-fee-adjuster'
import * as twapSwap from '../instructions/twap-swap'
import * as fee from '../instructions/fee'
import * as extruction from '../instructions/extruction'
import * as debug from '../instructions/debug/opcodes'

const USDC = new Address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
const WETH = new Address('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
const RECEIVER = new Address('0x0000000000000000000000000000000000000001')
const START_TIME = 1700000000n

const splitProgram = (program: SwapVmProgram): Array<{ opcodeByte: string; args: string }> => {
  const hex = trim0x(program.toString())
  const ixs: Array<{ opcodeByte: string; args: string }> = []
  let offset = 0

  while (offset < hex.length) {
    const argsEnd = offset + 4 + parseInt(hex.slice(offset + 2, offset + 4), 16) * 2
    ixs.push({
      opcodeByte: `0x${hex.slice(offset, offset + 2)}`,
      args: hex.slice(offset + 4, argsEnd),
    })
    offset = argsEnd
  }

  return ixs
}

type LimitInstructionCase = {
  method: keyof LimitProgramBuilder
  opcodeByte: string
  opcode: IOpcode
  append: (builder: LimitProgramBuilder) => LimitProgramBuilder
}

// Opcode bytes of LimitOpcodes._opcodes() in SwapVM, in table order
const LIMIT_INSTRUCTIONS: LimitInstructionCase[] = [
  {
    method: 'jump',
    opcodeByte: '0x0a',
    opcode: controls.jump,
    append: (b) => b.jump({ nextPC: 5n }),
  },
  {
    method: 'jumpIfTokenIn',
    opcodeByte: '0x0b',
    opcode: controls.jumpIfTokenIn,
    append: (b) => b.jumpIfTokenIn({ tokenTail: AddressHalf.fromAddress(USDC), nextPC: 6n }),
  },
  {
    method: 'jumpIfTokenOut',
    opcodeByte: '0x0c',
    opcode: controls.jumpIfTokenOut,
    append: (b) => b.jumpIfTokenOut({ tokenTail: AddressHalf.fromAddress(WETH), nextPC: 7n }),
  },
  {
    method: 'deadline',
    opcodeByte: '0x0d',
    opcode: controls.deadline,
    append: (b) => b.deadline({ deadline: 1735689600n }),
  },
  {
    method: 'onlyTakerTokenBalanceNonZero',
    opcodeByte: '0x0e',
    opcode: controls.onlyTakerTokenBalanceNonZero,
    append: (b) => b.onlyTakerTokenBalanceNonZero({ token: USDC }),
  },
  {
    method: 'onlyTakerTokenBalanceGte',
    opcodeByte: '0x0f',
    opcode: controls.onlyTakerTokenBalanceGte,
    append: (b) => b.onlyTakerTokenBalanceGte({ token: USDC, minAmount: 1000n }),
  },
  {
    method: 'onlyTakerTokenSupplyShareGte',
    opcodeByte: '0x10',
    opcode: controls.onlyTakerTokenSupplyShareGte,
    append: (b) => b.onlyTakerTokenSupplyShareGte({ token: WETH, minShareE18: 10n ** 15n }),
  },
  {
    method: 'staticBalancesXD',
    opcodeByte: '0x11',
    opcode: balances.staticBalancesXD,
    append: (b) =>
      b.staticBalancesXD({
        tokenBalances: [
          { tokenHalf: AddressHalf.fromAddress(USDC), value: 2000n * 10n ** 6n },
          { tokenHalf: AddressHalf.fromAddress(WETH), value: 10n ** 18n },
        ],
      }),
  },
  {
    method: 'invalidateBit1D',
    opcodeByte: '0x12',
    opcode: invalidators.invalidateBit1D,
    append: (b) => b.invalidateBit1D({ bitIndex: 42n }),
  },
  {
    method: 'invalidateTokenIn1D',
    opcodeByte: '0x13',
    opcode: invalidators.invalidateTokenIn1D,
    append: (b) => b.invalidateTokenIn1D(),
  },
  {
    method: 'invalidateTokenOut1D',
    opcodeByte: '0x14',
    opcode: invalidators.invalidateTokenOut1D,
    append: (b) => b.invalidateTokenOut1D(),
  },
  {
    method: 'limitSwap1D',
    opcodeByte: '0x15',
    opcode: limitSwap.limitSwap1D,
    append: (b) => b.limitSwap1D({ makerDirectionLt: true }),
  },
  {
    method: 'limitSwapOnlyFull1D',
    opcodeByte: '0x16',
    opcode: limitSwap.limitSwapOnlyFull1D,
    append: (b) => b.limitSwapOnlyFull1D({ makerDirectionLt: false }),
  },
  {
    method: 'requireMinRate1D',
    opcodeByte: '0x17',
    opcode: minRate.requireMinRate1D,
    append: (b) => b.requireMinRate1D({ rateLt: 2900n, rateGt: 1n }),
  },
  {
    method: 'adjustMinRate1D',
    opcodeByte: '0x18',
    opcode: minRate.adjustMinRate1D,
    append: (b) => b.adjustMinRate1D({ rateLt: 3100n, rateGt: 1n }),
  },
  {
    method: 'dutchAuctionBalanceIn1D',
    opcodeByte: '0x19',
    opcode: dutchAuction.dutchAuctionBalanceIn1D,
    append: (b) =>
      b.dutchAuctionBalanceIn1D({
        startTime: START_TIME,
        duration: 3600n,
        decayFactor: 999000000n,
      }),
  },
  {
    method: 'dutchAuctionBalanceOut1D',
    opcodeByte: '0x1a',
    opcode: dutchAuction.dutchAuctionBalanceOut1D,
    append: (b) =>
      b.dutchAuctionBalanceOut1D({
        startTime: START_TIME + 100n,
        duration: 7200n,
        decayFactor: 995000000n,
      }),
  },
  {
    method: 'baseFeeAdjuster1D',
    opcodeByte: '0x1b',
    opcode: baseFeeAdjuster.baseFeeAdjuster1D,
    append: (b) =>
      b.baseFeeAdjuster1D({
        baseGasPrice: 20000000000n,
        ethToToken1Price: 3000n * 10n ** 18n,
        gasAmount: 150000n,
        maxPriceDecay: 990000000000000000n,
      }),
  },
  {
    method: 'twap',
    opcodeByte: '0x1c',
    opcode: twapSwap.twap,
    append: (b) =>
      b.twap({
        balanceIn: 3000n * 10n ** 6n,
        balanceOut: 10n ** 18n,
        startTime: START_TIME,
        duration: 86400n,
        priceBumpAfterIlliquidity: 1100000000000000000n,
        minTradeAmountOut: 10n ** 16n,
      }),
  },
  {
    method: 'extruction',
    opcodeByte: '0x1d',
    opcode: extruction.extruction,
    append: (b) =>
      b.extruction({ target: USDC, extructionArgs: new HexString('0xabcdef1234567890') }),
  },
  {
    method: 'salt',
    opcodeByte: '0x1e',
    opcode: controls.salt,
    append: (b) => b.salt({ salt: 0x1234n }),
  },
  {
    method: 'flatFeeAmountInXD',
    opcodeByte: '0x1f',
    opcode: fee.flatFeeAmountInXD,
    append: (b) => b.flatFeeAmountInXD({ fee: 100000n }),
  },
  {
    method: 'flatFeeAmountOutXD',
    opcodeByte: '0x20',
    opcode: fee.flatFeeAmountOutXD,
    append: (b) => b.flatFeeAmountOutXD({ fee: 35000000n }),
  },
  {
    method: 'progressiveFeeInXD',
    opcodeByte: '0x21',
    opcode: fee.progressiveFeeInXD,
    append: (b) => b.progressiveFeeInXD({ fee: 45000000n }),
  },
  {
    method: 'progressiveFeeOutXD',
    opcodeByte: '0x22',
    opcode: fee.progressiveFeeOutXD,
    append: (b) => b.progressiveFeeOutXD({ fee: 55000000n }),
  },
  {
    method: 'protocolFeeAmountOutXD',
    opcodeByte: '0x23',
    opcode: fee.protocolFeeAmountOutXD,
    append: (b) => b.protocolFeeAmountOutXD({ fee: 20000000n, to: RECEIVER }),
  },
  {
    method: 'aquaProtocolFeeAmountOutXD',
    opcodeByte: '0x24',
    opcode: fee.aquaProtocolFeeAmountOutXD,
    append: (b) => b.aquaProtocolFeeAmountOutXD({ fee: 15000000n, to: RECEIVER }),
  },
  {
    method: 'protocolFeeAmountInXD',
    opcodeByte: '0x25',
    opcode: fee.protocolFeeAmountInXD,
    append: (b) => b.protocolFeeAmountInXD({ fee: 1000000n, to: RECEIVER }),
  },
  {
    method: 'aquaProtocolFeeAmountInXD',
    opcodeByte: '0x26',
    opcode: fee.aquaProtocolFeeAmountInXD,
    append: (b) => b.aquaProtocolFeeAmountInXD({ fee: 5000000n, to: RECEIVER }),
  },
  {
    method: 'dynamicProtocolFeeAmountInXD',
    opcodeByte: '0x27',
    opcode: fee.dynamicProtocolFeeAmountInXD,
    append: (b) => b.dynamicProtocolFeeAmountInXD({ feeProvider: RECEIVER }),
  },
  {
    method: 'aquaDynamicProtocolFeeAmountInXD',
    opcodeByte: '0x28',
    opcode: fee.aquaDynamicProtocolFeeAmountInXD,
    append: (b) => b.aquaDynamicProtocolFeeAmountInXD({ feeProvider: WETH }),
  },
]

const NOT_IN_LIMIT_TABLE: Array<{ name: string; ix: IInstruction }> = [
  { name: 'xycSwapXD', ix: xycSwap.xycSwapXD.createIx(new xycSwap.XycSwapXDArgs()) },
  {
    name: 'dynamicBalancesXD',
    ix: balances.dynamicBalancesXD.createIx(
      new balances.BalancesArgs([{ tokenHalf: AddressHalf.fromAddress(USDC), value: 1n }]),
    ),
  },
  {
    name: 'concentrateGrowLiquidity2D',
    ix: concentrate.concentrateGrowLiquidity2D.createIx(
      new concentrate.ConcentrateGrowLiquidity2DArgs(9n * 10n ** 17n, 11n * 10n ** 17n),
    ),
  },
  { name: 'decayXD', ix: decay.decayXD.createIx(new decay.DecayXDArgs(3600n)) },
  {
    name: 'peggedSwapGrowPriceRange2D',
    ix: peggedSwap.peggedSwapGrowPriceRange2D.createIx(
      peggedSwap.PeggedSwapArgs.fromTokens(
        { address: USDC, decimals: 6, reserve: 1_000_000n * 10n ** 6n },
        { address: WETH, decimals: 18, reserve: 500n * 10n ** 18n },
        8n * 10n ** 26n,
      ),
    ),
  },
  {
    name: 'onlyTxOriginTokenBalanceNonZero',
    ix: controls.onlyTxOriginTokenBalanceNonZero.createIx(
      new controls.OnlyTxOriginTokenBalanceNonZeroArgs(USDC),
    ),
  },
  {
    name: 'printSwapRegisters (debug)',
    ix: debug.printSwapRegisters.createIx(new debug.PrintSwapRegistersArgs()),
  },
]

describe('LimitProgramBuilder', () => {
  it('should mirror the LimitOpcodes table of SwapVM', () => {
    expect(limitInstructions).toHaveLength(41)
    expect(limitInstructions.slice(0, 10).every((opcode) => opcode === EMPTY_OPCODE)).toBe(true)
    expect(limitInstructions.slice(10).map((opcode) => opcode.id)).toEqual(
      LIMIT_INSTRUCTIONS.map(({ opcode }) => opcode.id),
    )
  })

  it('should expose a typed method for every instruction of the table and no debug helpers', () => {
    const methods = Object.getOwnPropertyNames(LimitProgramBuilder.prototype).filter(
      (name) => name !== 'constructor',
    )

    expect(methods.sort()).toEqual(LIMIT_INSTRUCTIONS.map(({ method }) => method).sort())
    expect('withDebug' in new LimitProgramBuilder()).toBe(false)
  })

  it.each(LIMIT_INSTRUCTIONS)(
    'should encode $method with opcode byte $opcodeByte',
    ({ opcodeByte, opcode, append }) => {
      const program = append(new LimitProgramBuilder()).build()

      expect(program.toString().slice(0, 4)).toBe(opcodeByte)
      expect(limitInstructions[Number(opcodeByte)]).toBe(opcode)

      const decoded = LimitProgramBuilder.decode(program)

      expect(decoded.getInstructions()).toHaveLength(1)
      expect(decoded.getInstructions()[0].opcode).toBe(opcode)
      expect(decoded.build().toString()).toBe(program.toString())
    },
  )

  it('should round trip a program that uses every instruction through decode and build', () => {
    const builder = LIMIT_INSTRUCTIONS.reduce(
      (acc, { append }) => append(acc),
      new LimitProgramBuilder(),
    )
    const program = builder.build()

    const decoded = LimitProgramBuilder.decode(program)

    expect(decoded).toBeInstanceOf(LimitProgramBuilder)
    expect(decoded.build().toString()).toBe(program.toString())
    expect(decoded.getInstructions().map((ix) => ix.opcode)).toEqual(
      builder.getInstructions().map((ix) => ix.opcode),
    )
    expect(decoded.getInstructions().map((ix) => ix.toJSON())).toEqual(
      builder.getInstructions().map((ix) => ix.toJSON()),
    )
  })

  it('should encode limitSwap1D as 0x15 where RegularProgramBuilder uses 0x19', () => {
    const limitProgram = new LimitProgramBuilder().limitSwap1D({ makerDirectionLt: true }).build()
    const regularProgram = new RegularProgramBuilder()
      .limitSwap1D({ makerDirectionLt: true })
      .build()

    expect(limitProgram.toString()).toBe('0x150101')
    expect(regularProgram.toString()).toBe('0x190101')
    expect(limitInstructions[0x19]).toBe(dutchAuction.dutchAuctionBalanceIn1D)
  })

  it('should encode a limit order with the args of RegularProgramBuilder and LimitOpcodes bytes', () => {
    const tokenBalances = [
      { tokenHalf: AddressHalf.fromAddress(USDC), value: 100n },
      { tokenHalf: AddressHalf.fromAddress(WETH), value: 200n },
    ]
    const buildLimitOrder = (builder: LimitProgramBuilder | RegularProgramBuilder): SwapVmProgram =>
      builder
        .staticBalancesXD({ tokenBalances })
        .limitSwapOnlyFull1D({ makerDirectionLt: true })
        .invalidateTokenOut1D()
        .salt({ salt: 0x1235n })
        .build()

    const limitIxs = splitProgram(buildLimitOrder(new LimitProgramBuilder()))
    const regularIxs = splitProgram(buildLimitOrder(new RegularProgramBuilder()))

    expect(limitIxs.map(({ opcodeByte }) => opcodeByte)).toEqual(['0x11', '0x16', '0x14', '0x1e'])
    expect(regularIxs.map(({ opcodeByte }) => opcodeByte)).toEqual(['0x11', '0x1a', '0x15', '0x22'])
    expect(limitIxs.map(({ args }) => args)).toEqual(regularIxs.map(({ args }) => args))
  })

  it.each(NOT_IN_LIMIT_TABLE)('should reject $name, which is not in the limit table', ({ ix }) => {
    const builder = new LimitProgramBuilder()

    expect(() => builder.add(ix)).toThrow(`Invalid opcode ${String(ix.opcode.id)}`)
    expect(builder.getInstructions()).toHaveLength(0)
  })

  it('should reject opcode bytes the limit table does not define', () => {
    expect(() => LimitProgramBuilder.decode(new SwapVmProgram('0x2900'))).toThrow(
      'Opcode at index 41 is missing',
    )
    expect(() => LimitProgramBuilder.decode(new SwapVmProgram('0x2d00'))).toThrow(
      'Opcode at index 45 is missing',
    )
    expect(() => LimitProgramBuilder.decode(new SwapVmProgram('0x0000'))).toThrow(
      'Invalid opcode: 0 (NOT_INSTRUCTION)',
    )
  })
})
