// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { trim0x } from '@1inch/byte-utils'
import { Address, HexString } from '@1inch/sdk-core'
import { SwappedEvent } from './swapped-event'

const orderHash = new HexString(
  '0x1111111111111111111111111111111111111111111111111111111111111111',
)
const maker = new Address('0x0000000000000000000000000000000000000001')
const taker = new Address('0x0000000000000000000000000000000000000002')
const tokenIn = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const tokenOut = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

describe('SwappedEvent', () => {
  it('should construct from new()', () => {
    const event = SwappedEvent.new({
      orderHash,
      maker,
      taker,
      tokenIn,
      tokenOut,
      amountIn: 100n,
      amountOut: 200n,
    })

    expect(event.orderHash.equal(orderHash)).toBe(true)
    expect(event.maker.equal(maker)).toBe(true)
    expect(event.taker.equal(taker)).toBe(true)
    expect(event.tokenIn.equal(tokenIn)).toBe(true)
    expect(event.tokenOut.equal(tokenOut)).toBe(true)
    expect(event.amountIn).toBe(100n)
    expect(event.amountOut).toBe(200n)
  })

  it('should decode a valid Swapped log', () => {
    const data = `0x${trim0x(orderHash.toString())}${trim0x(maker.toString()).padStart(64, '0')}${trim0x(taker.toString()).padStart(64, '0')}${trim0x(tokenIn.toString()).padStart(64, '0')}${trim0x(tokenOut.toString()).padStart(64, '0')}${1000n.toString(16).padStart(64, '0')}${2000n.toString(16).padStart(64, '0')}`

    const event = SwappedEvent.fromLog({
      address: '0x111111338c5091e8440b67b168bae16a668ac0de',
      topics: [SwappedEvent.TOPIC.toString()],
      data,
    })

    expect(event.orderHash.toString()).toBe(orderHash.toString())
    expect(event.maker.toString()).toBe(maker.toString())
    expect(event.taker.toString()).toBe(taker.toString())
    expect(event.tokenIn.toString()).toBe(tokenIn.toString())
    expect(event.tokenOut.toString()).toBe(tokenOut.toString())
    expect(event.amountIn).toBe(1000n)
    expect(event.amountOut).toBe(2000n)
  })

  it('should throw on an invalid topic', () => {
    expect(() =>
      SwappedEvent.fromLog({
        address: '0x111111338c5091e8440b67b168bae16a668ac0de',
        topics: ['0xdeadbeef'],
        data: '0x',
      }),
    ).toThrow()
  })
})
