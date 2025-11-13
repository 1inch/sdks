import { describe, it, expect } from 'vitest'
import { Address, AddressHalf, HexString } from '@1inch/sdk-core'
import type * as balances from '../instructions/balances'
import type * as controls from '../instructions/controls'
import type * as invalidators from '../instructions/invalidators'
import * as xycSwap from '../instructions/xyc-swap'
import type * as concentrate from '../instructions/concentrate'
import type * as decay from '../instructions/decay'
import type * as limitSwap from '../instructions/limit-swap'
import type * as minRate from '../instructions/min-rate'
import type * as dutchAuction from '../instructions/dutch-auction'
import type * as oraclePriceAdjuster from '../instructions/oracle-price-adjuster'
import type * as baseFeeAdjuster from '../instructions/base-fee-adjuster'
import type * as twapSwap from '../instructions/twap-swap'
import type * as stableSwap from '../instructions/stable-swap'
import type * as fee from '../instructions/fee'
import type * as extruction from '../instructions/extruction'
import { RegularProgramBuilder } from './'

describe('ProgramBuilder', () => {
  const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
  const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
  const DAI = new Address('0x6B175474E89094C44Da98b954EedeAC495271d0F')
  const LINK = new Address('0x514910771AF9Ca656af840dff83E8264EcF986CA')

  const LINK_HALF = AddressHalf.fromAddress(LINK)
  const USDC_HALF = AddressHalf.fromAddress(USDC)
  const WETH_HALF = AddressHalf.fromAddress(WETH)

  it('should encode and decode program correctly for REGULAR', () => {
    const originalBuilder = new RegularProgramBuilder()

    const program = originalBuilder
      .setBalancesXD({
        tokenBalances: [
          { tokenHalf: USDC_HALF, value: 2000n * 10n ** 6n },
          { tokenHalf: WETH_HALF, value: 1n * 10n ** 18n },
        ],
      })
      .build()
    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(1)
    expect(ixs[0].opcode.id.toString()).toContain('setBalancesXD')
    expect((ixs[0].args as balances.BalancesArgs).tokenBalances).toHaveLength(2)
  })

  it('should handle complex control flow operations', () => {
    const originalBuilder = new RegularProgramBuilder()

    const program = originalBuilder
      .salt({ salt: 5n })
      .onlyTakerTokenBalanceNonZero({ token: WETH })
      .onlyTakerTokenBalanceGte({
        token: USDC,
        minAmount: 1000n * 10n ** 6n,
      })
      .jumpIfExactIn({ nextPC: 10n })
      .onlyTakerTokenSupplyShareGte({
        token: DAI,
        minShareE18: 10n ** 15n, // 0.001 (0.1% of supply)
      })
      .jump({ nextPC: 20n })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(6)

    expect(ixs[0].opcode.id.toString()).toContain('salt')
    expect((ixs[0].args as controls.SaltArgs).salt).toBe(5n)

    expect(ixs[1].opcode.id.toString()).toContain('onlyTakerTokenBalanceNonZero')
    expect((ixs[1].args as controls.OnlyTakerTokenBalanceNonZeroArgs).token.toString()).toBe(
      WETH.toString(),
    )

    expect(ixs[2].opcode.id.toString()).toContain('onlyTakerTokenBalanceGte')
    const balanceGteArgs = ixs[2].args as controls.OnlyTakerTokenBalanceGteArgs
    expect(balanceGteArgs.token.toString()).toBe(USDC.toString())
    expect(balanceGteArgs.minAmount).toBe(1000n * 10n ** 6n)

    expect(ixs[3].opcode.id.toString()).toContain('jumpIfExactIn')
    expect((ixs[3].args as controls.JumpArgs).nextPC).toBe(10n)

    expect(ixs[4].opcode.id.toString()).toContain('onlyTakerTokenSupplyShareGte')
    const supplyShareArgs = ixs[4].args as controls.OnlyTakerTokenSupplyShareGteArgs
    expect(supplyShareArgs.token.toString()).toBe(DAI.toString())
    expect(supplyShareArgs.minShareE18).toBe(10n ** 15n)

    expect(ixs[5].opcode.id.toString()).toContain('jump')
    expect((ixs[5].args as controls.JumpArgs).nextPC).toBe(20n)
  })

  it('should combine balances and control instructions', () => {
    const originalBuilder = new RegularProgramBuilder()

    const program = originalBuilder
      .salt({ salt: 5n })
      .setBalancesXD({
        tokenBalances: [
          { tokenHalf: USDC_HALF, value: 5000n * 10n ** 6n },
          { tokenHalf: WETH_HALF, value: 2n * 10n ** 18n },
          { tokenHalf: LINK_HALF, value: 100n * 10n ** 18n },
        ],
      })
      .onlyTakerTokenBalanceGte({
        token: USDC,
        minAmount: 100n * 10n ** 6n,
      })
      .jumpIfExactOut({ nextPC: 15n })
      .balancesXD({
        tokenBalances: [{ tokenHalf: WETH_HALF, value: 10n ** 18n }],
      })
      .onlyTakerTokenSupplyShareGte({
        token: LINK,
        minShareE18: 5n * 10n ** 14n, // 0.0005 (0.05% of supply)
      })
      .jump({ nextPC: 25n })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(7)

    expect(ixs[0].opcode.id.toString()).toContain('salt')
    expect((ixs[0].args as controls.SaltArgs).salt).toBe(5n)

    expect(ixs[1].opcode.id.toString()).toContain('setBalancesXD')
    const setBalancesArgs = ixs[1].args as balances.BalancesArgs
    expect(setBalancesArgs.tokenBalances).toHaveLength(3)
    expect(setBalancesArgs.tokenBalances[0].value).toBe(5000n * 10n ** 6n)
    expect(setBalancesArgs.tokenBalances[1].value).toBe(2n * 10n ** 18n)
    expect(setBalancesArgs.tokenBalances[2].value).toBe(100n * 10n ** 18n)

    expect(ixs[2].opcode.id.toString()).toContain('onlyTakerTokenBalanceGte')
    const balanceCheck = ixs[2].args as controls.OnlyTakerTokenBalanceGteArgs
    expect(balanceCheck.token.toString()).toBe(USDC.toString())
    expect(balanceCheck.minAmount).toBe(100n * 10n ** 6n)

    expect(ixs[3].opcode.id.toString()).toContain('jumpIfExactOut')
    expect((ixs[3].args as controls.JumpArgs).nextPC).toBe(15n)

    expect(ixs[4].opcode.id.toString()).toContain('balancesXD')
    const balancesArgs = ixs[4].args as balances.BalancesArgs
    expect(balancesArgs.tokenBalances).toHaveLength(1)
    expect(balancesArgs.tokenBalances[0].value).toBe(10n ** 18n)

    expect(ixs[5].opcode.id.toString()).toContain('onlyTakerTokenSupplyShareGte')
    const supplyShare = ixs[5].args as controls.OnlyTakerTokenSupplyShareGteArgs
    expect(supplyShare.token.toString()).toBe(LINK.toString())
    expect(supplyShare.minShareE18).toBe(5n * 10n ** 14n)

    expect(ixs[6].opcode.id.toString()).toContain('jump')
    expect((ixs[6].args as controls.JumpArgs).nextPC).toBe(25n)
  })

  it('should handle invalidator instructions', () => {
    const originalBuilder = new RegularProgramBuilder()

    const program = originalBuilder
      .invalidateBit1D({ bitIndex: 42n })
      .invalidateTokenIn1D({ tokenInHalf: USDC_HALF })
      .invalidateTokenOut1D({ tokenOutHalf: WETH_HALF })
      .invalidateBit1D({ bitIndex: 256n })
      .invalidateTokenIn1D({ tokenInHalf: AddressHalf.fromAddress(DAI) })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(5)

    expect(ixs[0].opcode.id.toString()).toContain('invalidateBit1D')
    expect((ixs[0].args as invalidators.InvalidateBit1DArgs).bitIndex).toBe(42n)

    expect(ixs[1].opcode.id.toString()).toContain('invalidateTokenIn1D')
    expect((ixs[1].args as invalidators.InvalidateTokenIn1DArgs).tokenInHalf.toString()).toBe(
      USDC_HALF.toString(),
    )

    expect(ixs[2].opcode.id.toString()).toContain('invalidateTokenOut1D')
    expect((ixs[2].args as invalidators.InvalidateTokenOut1DArgs).tokenOutHalf.toString()).toBe(
      WETH_HALF.toString(),
    )

    expect(ixs[3].opcode.id.toString()).toContain('invalidateBit1D')
    expect((ixs[3].args as invalidators.InvalidateBit1DArgs).bitIndex).toBe(256n)

    expect(ixs[4].opcode.id.toString()).toContain('invalidateTokenIn1D')
    const daiHalf = AddressHalf.fromAddress(DAI)
    expect((ixs[4].args as invalidators.InvalidateTokenIn1DArgs).tokenInHalf.toString()).toBe(
      daiHalf.toString(),
    )
  })

  it('should combine all instruction types in complex program', () => {
    const originalBuilder = new RegularProgramBuilder()

    const program = originalBuilder
      .salt({ salt: 99n })
      .invalidateBit1D({ bitIndex: 1024n })
      .setBalancesXD({
        tokenBalances: [
          { tokenHalf: USDC_HALF, value: 10000n * 10n ** 6n },
          { tokenHalf: WETH_HALF, value: 5n * 10n ** 18n },
        ],
      })
      .onlyTakerTokenBalanceNonZero({ token: WETH })
      .invalidateTokenIn1D({ tokenInHalf: USDC_HALF })
      .jumpIfExactIn({ nextPC: 20n })
      .balancesXD({
        tokenBalances: [{ tokenHalf: LINK_HALF, value: 50n * 10n ** 18n }],
      })
      .onlyTakerTokenBalanceGte({
        token: DAI,
        minAmount: 500n * 10n ** 18n,
      })
      .invalidateTokenOut1D({ tokenOutHalf: LINK_HALF })
      .onlyTakerTokenSupplyShareGte({
        token: USDC,
        minShareE18: 10n ** 16n,
      })
      .jump({ nextPC: 30n })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(11)

    expect(ixs[0].opcode.id.toString()).toContain('salt')
    expect((ixs[0].args as controls.SaltArgs).salt).toBe(99n)

    expect(ixs[1].opcode.id.toString()).toContain('invalidateBit1D')
    expect((ixs[1].args as invalidators.InvalidateBit1DArgs).bitIndex).toBe(1024n)

    expect(ixs[2].opcode.id.toString()).toContain('setBalancesXD')
    const setBalances = ixs[2].args as balances.BalancesArgs
    expect(setBalances.tokenBalances).toHaveLength(2)
    expect(setBalances.tokenBalances[0].value).toBe(10000n * 10n ** 6n)

    expect(ixs[3].opcode.id.toString()).toContain('onlyTakerTokenBalanceNonZero')
    expect((ixs[3].args as controls.OnlyTakerTokenBalanceNonZeroArgs).token.toString()).toBe(
      WETH.toString(),
    )

    expect(ixs[4].opcode.id.toString()).toContain('invalidateTokenIn1D')
    expect((ixs[4].args as invalidators.InvalidateTokenIn1DArgs).tokenInHalf.toString()).toBe(
      USDC_HALF.toString(),
    )

    expect(ixs[5].opcode.id.toString()).toContain('jumpIfExactIn')
    expect((ixs[5].args as controls.JumpArgs).nextPC).toBe(20n)

    expect(ixs[6].opcode.id.toString()).toContain('balancesXD')
    const readBalances = ixs[6].args as balances.BalancesArgs
    expect(readBalances.tokenBalances).toHaveLength(1)
    expect(readBalances.tokenBalances[0].value).toBe(50n * 10n ** 18n)

    expect(ixs[7].opcode.id.toString()).toContain('onlyTakerTokenBalanceGte')
    const balanceGte = ixs[7].args as controls.OnlyTakerTokenBalanceGteArgs
    expect(balanceGte.token.toString()).toBe(DAI.toString())
    expect(balanceGte.minAmount).toBe(500n * 10n ** 18n)

    expect(ixs[8].opcode.id.toString()).toContain('invalidateTokenOut1D')
    expect((ixs[8].args as invalidators.InvalidateTokenOut1DArgs).tokenOutHalf.toString()).toBe(
      LINK_HALF.toString(),
    )

    expect(ixs[9].opcode.id.toString()).toContain('onlyTakerTokenSupplyShareGte')
    const supplyShare = ixs[9].args as controls.OnlyTakerTokenSupplyShareGteArgs
    expect(supplyShare.token.toString()).toBe(USDC.toString())
    expect(supplyShare.minShareE18).toBe(10n ** 16n)

    expect(ixs[10].opcode.id.toString()).toContain('jump')
    expect((ixs[10].args as controls.JumpArgs).nextPC).toBe(30n)
  })

  it('should handle xycSwap, concentrate and decay instructions', () => {
    const originalBuilder = new RegularProgramBuilder()

    const program = originalBuilder
      .setBalancesXD({
        tokenBalances: [
          { tokenHalf: USDC_HALF, value: 2000n * 10n ** 6n },
          { tokenHalf: WETH_HALF, value: 1n * 10n ** 18n },
        ],
      })
      .xycSwapXD()
      .concentrateGrowLiquidityXD({
        tokenDeltas: [
          { tokenHalf: USDC_HALF, delta: 100n * 10n ** 18n },
          { tokenHalf: WETH_HALF, delta: 50n * 10n ** 18n },
        ],
      })
      .concentrateGrowLiquidity2D({
        deltaLt: 1000n * 10n ** 18n,
        deltaGt: 500n * 10n ** 18n,
      })
      .decayXD({ decayPeriod: 3600n })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(5)

    expect(ixs[0].opcode.id.toString()).toContain('setBalancesXD')
    const setBalances = ixs[0].args as balances.BalancesArgs
    expect(setBalances.tokenBalances).toHaveLength(2)

    expect(ixs[1].opcode.id.toString()).toContain('xycSwapXD')
    expect(ixs[1].args).toBeInstanceOf(xycSwap.XycSwapXDArgs)

    expect(ixs[2].opcode.id.toString()).toContain('concentrateGrowLiquidityXD')
    const concentrateXD = ixs[2].args as concentrate.ConcentrateGrowLiquidityXDArgs
    expect(concentrateXD.tokenDeltas).toHaveLength(2)
    expect(concentrateXD.tokenDeltas[0].tokenHalf.toString()).toBe(USDC_HALF.toString())
    expect(concentrateXD.tokenDeltas[0].delta).toBe(100n * 10n ** 18n)

    expect(ixs[3].opcode.id.toString()).toContain('concentrateGrowLiquidity2D')
    const concentrate2D = ixs[3].args as concentrate.ConcentrateGrowLiquidity2DArgs
    expect(concentrate2D.deltaLt).toBe(1000n * 10n ** 18n)
    expect(concentrate2D.deltaGt).toBe(500n * 10n ** 18n)

    expect(ixs[4].opcode.id.toString()).toContain('decayXD')
    const decayArgs = ixs[4].args as decay.DecayXDArgs
    expect(decayArgs.decayPeriod).toBe(3600n)
  })

  it('should combine trading, control and invalidator instructions', () => {
    const originalBuilder = new RegularProgramBuilder()

    const program = originalBuilder
      .salt({ salt: 777n })
      .invalidateBit1D({ bitIndex: 512n })
      .setBalancesXD({
        tokenBalances: [
          { tokenHalf: USDC_HALF, value: 50000n * 10n ** 6n },
          { tokenHalf: WETH_HALF, value: 25n * 10n ** 18n },
          { tokenHalf: LINK_HALF, value: 1000n * 10n ** 18n },
        ],
      })
      .concentrateGrowLiquidityXD({
        tokenDeltas: [
          { tokenHalf: USDC_HALF, delta: 1000n * 10n ** 18n },
          { tokenHalf: WETH_HALF, delta: 5n * 10n ** 18n },
        ],
      })
      .jumpIfExactIn({ nextPC: 10n })
      .decayXD({ decayPeriod: 43200n }) // 12 hours (must be <= 65535)
      .xycSwapXD()
      .invalidateTokenIn1D({ tokenInHalf: USDC_HALF })
      .invalidateTokenOut1D({ tokenOutHalf: WETH_HALF })
      .concentrateGrowLiquidity2D({
        deltaLt: 2000n * 10n ** 18n,
        deltaGt: 1000n * 10n ** 18n,
      })
      .jump({ nextPC: 50n })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(11)

    expect(ixs[0].opcode.id.toString()).toContain('salt')
    expect((ixs[0].args as controls.SaltArgs).salt).toBe(777n)

    expect(ixs[1].opcode.id.toString()).toContain('invalidateBit1D')
    expect((ixs[1].args as invalidators.InvalidateBit1DArgs).bitIndex).toBe(512n)

    expect(ixs[2].opcode.id.toString()).toContain('setBalancesXD')

    expect(ixs[3].opcode.id.toString()).toContain('concentrateGrowLiquidityXD')
    const concentrateXD = ixs[3].args as concentrate.ConcentrateGrowLiquidityXDArgs
    expect(concentrateXD.tokenDeltas).toHaveLength(2)

    expect(ixs[4].opcode.id.toString()).toContain('jumpIfExactIn')

    expect(ixs[5].opcode.id.toString()).toContain('decayXD')
    expect((ixs[5].args as decay.DecayXDArgs).decayPeriod).toBe(43200n)

    expect(ixs[6].opcode.id.toString()).toContain('xycSwapXD')

    expect(ixs[7].opcode.id.toString()).toContain('invalidateTokenIn1D')

    expect(ixs[8].opcode.id.toString()).toContain('invalidateTokenOut1D')

    expect(ixs[9].opcode.id.toString()).toContain('concentrateGrowLiquidity2D')
    const concentrate2D = ixs[9].args as concentrate.ConcentrateGrowLiquidity2DArgs
    expect(concentrate2D.deltaLt).toBe(2000n * 10n ** 18n)
    expect(concentrate2D.deltaGt).toBe(1000n * 10n ** 18n)

    expect(ixs[10].opcode.id.toString()).toContain('jump')
    expect((ixs[10].args as controls.JumpArgs).nextPC).toBe(50n)
  })

  it('should handle limit swap and min rate instructions', () => {
    const originalBuilder = new RegularProgramBuilder()

    const program = originalBuilder
      .setBalancesXD({
        tokenBalances: [
          { tokenHalf: USDC_HALF, value: 3000n * 10n ** 6n },
          { tokenHalf: WETH_HALF, value: 1n * 10n ** 18n },
        ],
      })
      .limitSwap1D({ makerDirectionLt: true })
      .requireMinRate1D({ rateLt: 2900n, rateGt: 1n })
      .limitSwapOnlyFull1D({ makerDirectionLt: false })
      .adjustMinRate1D({ rateLt: 3100n, rateGt: 1n })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(5)

    expect(ixs[0].opcode.id.toString()).toContain('setBalancesXD')

    expect(ixs[1].opcode.id.toString()).toContain('limitSwap1D')
    expect((ixs[1].args as limitSwap.LimitSwapDirectionArgs).makerDirectionLt).toBe(true)

    expect(ixs[2].opcode.id.toString()).toContain('requireMinRate1D')
    const minRate1 = ixs[2].args as minRate.MinRateArgs
    expect(minRate1.rateLt).toBe(2900n)
    expect(minRate1.rateGt).toBe(1n)

    expect(ixs[3].opcode.id.toString()).toContain('limitSwapOnlyFull1D')
    expect((ixs[3].args as limitSwap.LimitSwapDirectionArgs).makerDirectionLt).toBe(false)

    expect(ixs[4].opcode.id.toString()).toContain('adjustMinRate1D')
    const minRate2 = ixs[4].args as minRate.MinRateArgs
    expect(minRate2.rateLt).toBe(3100n)
    expect(minRate2.rateGt).toBe(1n)
  })

  it('should handle dutch auction instructions', () => {
    const originalBuilder = new RegularProgramBuilder()
    const startTime = 1700000000n
    const duration = 3600n
    const decayFactor = 999000000n

    const program = originalBuilder
      .setBalancesXD({
        tokenBalances: [{ tokenHalf: USDC_HALF, value: 1000n * 10n ** 6n }],
      })
      .dutchAuctionAmountIn1D({
        startTime,
        duration,
        decayFactor,
      })
      .dutchAuctionAmountOut1D({
        startTime: startTime + 100n,
        duration: 7200n,
        decayFactor: 995000000n,
      })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(3)

    expect(ixs[1].opcode.id.toString()).toContain('dutchAuctionAmountIn1D')
    const dutchIn = ixs[1].args as dutchAuction.DutchAuctionArgs
    expect(dutchIn.startTime).toBe(startTime)
    expect(dutchIn.duration).toBe(duration)
    expect(dutchIn.decayFactor).toBe(decayFactor)

    expect(ixs[2].opcode.id.toString()).toContain('dutchAuctionAmountOut1D')
    const dutchOut = ixs[2].args as dutchAuction.DutchAuctionArgs
    expect(dutchOut.startTime).toBe(startTime + 100n)
    expect(dutchOut.duration).toBe(7200n)
    expect(dutchOut.decayFactor).toBe(995000000n)
  })

  it('should handle oracle and base fee adjusters', () => {
    const originalBuilder = new RegularProgramBuilder()
    const oracle = new Address('0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419')

    const program = originalBuilder
      .limitSwap1D({ makerDirectionLt: true })
      .oraclePriceAdjuster1D({
        maxPriceDecay: 950000000000000000n,
        maxStaleness: 3600n,
        oracleDecimals: 8n,
        oracleAddress: oracle,
      })
      .baseFeeAdjuster1D({
        baseGasPrice: 20000000000n,
        ethToToken1Price: 3000n * 10n ** 18n,
        gasAmount: 150000n,
        maxPriceDecay: 990000000000000000n,
      })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(3)

    expect(ixs[1].opcode.id.toString()).toContain('oraclePriceAdjuster1D')
    const oracleArgs = ixs[1].args as oraclePriceAdjuster.OraclePriceAdjusterArgs
    expect(oracleArgs.maxPriceDecay).toBe(950000000000000000n)
    expect(oracleArgs.maxStaleness).toBe(3600n)
    expect(oracleArgs.oracleDecimals).toBe(8n)
    expect(oracleArgs.oracleAddress.toString()).toBe(oracle.toString())

    expect(ixs[2].opcode.id.toString()).toContain('baseFeeAdjuster1D')
    const baseFeeArgs = ixs[2].args as baseFeeAdjuster.BaseFeeAdjusterArgs
    expect(baseFeeArgs.baseGasPrice).toBe(20000000000n)
    expect(baseFeeArgs.ethToToken1Price).toBe(3000n * 10n ** 18n)
    expect(baseFeeArgs.gasAmount).toBe(150000n)
    expect(baseFeeArgs.maxPriceDecay).toBe(990000000000000000n)
  })

  it('should handle TWAP swap instruction', () => {
    const originalBuilder = new RegularProgramBuilder()
    const startTime = 1700000000n

    const program = originalBuilder
      .twap({
        balanceIn: 3000n * 10n ** 6n,
        balanceOut: 1n * 10n ** 18n,
        startTime,
        duration: 86400n,
        priceBumpAfterIlliquidity: 1100000000000000000n,
        minTradeAmountOut: 10n ** 16n,
      })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(1)

    expect(ixs[0].opcode.id.toString()).toContain('twap')
    const twapArgs = ixs[0].args as twapSwap.TWAPSwapArgs
    expect(twapArgs.balanceIn).toBe(3000n * 10n ** 6n)
    expect(twapArgs.balanceOut).toBe(1n * 10n ** 18n)
    expect(twapArgs.startTime).toBe(startTime)
    expect(twapArgs.duration).toBe(86400n)
    expect(twapArgs.priceBumpAfterIlliquidity).toBe(1100000000000000000n)
    expect(twapArgs.minTradeAmountOut).toBe(10n ** 16n)
  })

  it('should handle stable swap instruction', () => {
    const originalBuilder = new RegularProgramBuilder()

    const program = originalBuilder
      .stableSwap2D({
        fee: 3000000n,
        A: 100n,
        rateLt: 1000000000000000000n,
        rateGt: 1000000000000000000n,
      })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(1)

    expect(ixs[0].opcode.id.toString()).toContain('stableSwap2D')
    const stableArgs = ixs[0].args as stableSwap.StableSwap2DArgs
    expect(stableArgs.fee).toBe(3000000n)
    expect(stableArgs.A).toBe(100n)
    expect(stableArgs.rateLt).toBe(1000000000000000000n)
    expect(stableArgs.rateGt).toBe(1000000000000000000n)
  })

  it('should handle extruction instruction', () => {
    const originalBuilder = new RegularProgramBuilder()
    const targetContract = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    const extructionData = new HexString('0xabcdef1234567890abcdef1234567890')

    const program = originalBuilder
      .extruction({
        target: targetContract,
        extructionArgs: extructionData,
      })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(1)

    expect(ixs[0].opcode.id.toString()).toContain('extruction')
    const extructionArgs = ixs[0].args as extruction.ExtructionArgs
    expect(extructionArgs.target.toString()).toBe(targetContract.toString())
    expect(extructionArgs.extructionArgs.toString()).toBe(extructionData.toString())
  })

  it('should handle all fee instructions', () => {
    const originalBuilder = new RegularProgramBuilder()
    const feeRecipient = new Address('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45')

    const program = originalBuilder
      .flatFeeXD({ fee: 30000000n })
      .flatFeeAmountInXD({ fee: 25000000n })
      .flatFeeAmountOutXD({ fee: 20000000n })
      .progressiveFeeXD({ fee: 15000000n })
      .protocolFeeAmountOutXD({
        fee: 10000000n,
        to: feeRecipient,
      })
      .aquaProtocolFeeAmountOutXD({
        fee: 5000000n,
        to: feeRecipient,
      })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(6)

    expect(ixs[0].opcode.id.toString()).toContain('flatFeeXD')
    expect((ixs[0].args as fee.FlatFeeArgs).fee).toBe(30000000n)

    expect(ixs[1].opcode.id.toString()).toContain('flatFeeAmountInXD')
    expect((ixs[1].args as fee.FlatFeeArgs).fee).toBe(25000000n)

    expect(ixs[2].opcode.id.toString()).toContain('flatFeeAmountOutXD')
    expect((ixs[2].args as fee.FlatFeeArgs).fee).toBe(20000000n)

    expect(ixs[3].opcode.id.toString()).toContain('progressiveFeeXD')
    expect((ixs[3].args as fee.FlatFeeArgs).fee).toBe(15000000n)

    expect(ixs[4].opcode.id.toString()).toContain('protocolFeeAmountOutXD')
    const protocolFee = ixs[4].args as fee.ProtocolFeeArgs
    expect(protocolFee.fee).toBe(10000000n)
    expect(protocolFee.to.toString()).toBe(feeRecipient.toString())

    expect(ixs[5].opcode.id.toString()).toContain('aquaProtocolFeeAmountOutXD')
    const aquaFee = ixs[5].args as fee.ProtocolFeeArgs
    expect(aquaFee.fee).toBe(5000000n)
    expect(aquaFee.to.toString()).toBe(feeRecipient.toString())
  })

  it('should handle complex program with new instructions', () => {
    const originalBuilder = new RegularProgramBuilder()
    const oracle = new Address('0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419')
    const feeRecipient = new Address('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45')

    const program = originalBuilder
      .salt({ salt: 12345n })
      .setBalancesXD({
        tokenBalances: [
          { tokenHalf: USDC_HALF, value: 10000n * 10n ** 6n },
          { tokenHalf: WETH_HALF, value: 3n * 10n ** 18n },
        ],
      })
      .limitSwap1D({ makerDirectionLt: true })
      .progressiveFeeXD({ fee: 3000000n })
      .oraclePriceAdjuster1D({
        maxPriceDecay: 950000000000000000n,
        maxStaleness: 3600n,
        oracleDecimals: 8n,
        oracleAddress: oracle,
      })
      .requireMinRate1D({ rateLt: 3000n, rateGt: 1n })
      .protocolFeeAmountOutXD({
        fee: 1000000n,
        to: feeRecipient,
      })
      .invalidateBit1D({ bitIndex: 999n })
      .build()

    const decodedBuilder = RegularProgramBuilder.decode(program)
    const decodedProgram = decodedBuilder.build()
    expect(decodedProgram.toString()).toBe(program.toString())

    const ixs = decodedBuilder.getInstructions()
    expect(ixs).toHaveLength(8)

    expect(ixs[0].opcode.id.toString()).toContain('salt')
    expect(ixs[1].opcode.id.toString()).toContain('setBalancesXD')
    expect(ixs[2].opcode.id.toString()).toContain('limitSwap1D')
    expect(ixs[3].opcode.id.toString()).toContain('progressiveFeeXD')
    expect(ixs[4].opcode.id.toString()).toContain('oraclePriceAdjuster1D')
    expect(ixs[5].opcode.id.toString()).toContain('requireMinRate1D')
    expect(ixs[6].opcode.id.toString()).toContain('protocolFeeAmountOutXD')
    expect(ixs[7].opcode.id.toString()).toContain('invalidateBit1D')
  })
})
