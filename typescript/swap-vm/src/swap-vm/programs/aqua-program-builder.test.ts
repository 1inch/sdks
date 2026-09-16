// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, AddressHalf } from '@1inch/sdk-core'
import { AquaProgramBuilder } from './aqua-program-builder'
import { PeggedSwapArgs } from '../instructions/pegged-swap'

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
      .jumpIfTokenIn({ tokenTail: AddressHalf.fromAddress(USDC), nextPC: 6n })
      .jumpIfTokenOut({ tokenTail: AddressHalf.fromAddress(WETH), nextPC: 7n })
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
})
