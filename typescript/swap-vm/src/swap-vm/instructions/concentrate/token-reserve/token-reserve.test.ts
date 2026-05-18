// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { TokenReserve } from './token-reserve'

const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

describe('TokenReserve', () => {
  it('new should construct from Address and bigint reserve', () => {
    const reserve = TokenReserve.new({ token: USDC, reserve: 1_000_000n })

    expect(reserve.token.equal(USDC)).toBe(true)
    expect(reserve.reserve).toBe(1_000_000n)
  })

  it('toJSON should yield bigint-safe JSON', () => {
    const reserve = new TokenReserve(USDC, 18446744073709551615n)
    const json = reserve.toJSON()

    expect(json.reserve).toBe('18446744073709551615')
    expect(json.token).toBe(USDC.toString())
    expect(JSON.stringify(reserve)).toBe(JSON.stringify(json))
  })

  it('fromJSON should round-trip toJSON', () => {
    const original = TokenReserve.new({ token: USDC, reserve: 42n })

    expect(TokenReserve.fromJSON(original.toJSON()).reserve).toBe(42n)
    expect(TokenReserve.fromJSON(original.toJSON()).token.equal(USDC)).toBe(true)
  })
})
