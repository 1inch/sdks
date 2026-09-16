// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { AquaPeggedAmmStrategy } from './aqua-pegged-amm-strategy'
import { AquaProgramBuilder } from '../programs/aqua-program-builder'

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
})
