// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { encodeAbiParameters, encodeEventTopics } from 'viem'
import type { Log } from 'viem'
import { Address, HexString } from '@1inch/sdk-core'
import { SwappedEvent } from './swapped-event'
import { SWAP_VM_ABI } from '../../abi/SwapVM.abi'

describe('SwappedEvent', () => {
  const orderHash = `0x${'ab'.repeat(32)}` as const
  const maker = '0x1234567890123456789012345678901234567890'
  const taker = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  const tokenIn = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // USDC
  const tokenOut = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH
  const amountIn = 1_000_000n
  const amountOut = 500_000_000_000_000_000n

  // Every field of `Swapped` is non-indexed, so topic0 is the only topic and
  // the whole payload lives in `data`.
  const SWAPPED_PARAMS = [
    { name: 'orderHash', type: 'bytes32' },
    { name: 'maker', type: 'address' },
    { name: 'taker', type: 'address' },
    { name: 'tokenIn', type: 'address' },
    { name: 'tokenOut', type: 'address' },
    { name: 'amountIn', type: 'uint256' },
    { name: 'amountOut', type: 'uint256' },
  ] as const

  const encodeData = (inAmount: bigint, outAmount: bigint): `0x${string}` =>
    encodeAbiParameters(SWAPPED_PARAMS, [
      orderHash,
      maker as `0x${string}`,
      taker as `0x${string}`,
      tokenIn as `0x${string}`,
      tokenOut as `0x${string}`,
      inAmount,
      outAmount,
    ])

  const encoded = {
    topics: encodeEventTopics({ abi: SWAP_VM_ABI, eventName: 'Swapped' }),
    data: encodeData(amountIn, amountOut),
  }

  const buildLog = (overrides: Partial<Log> = {}): Log =>
    ({
      address: '0x11111112542d85b3ef69ae05771c2dccff4faa26' as `0x${string}`,
      topics: encoded.topics,
      data: encoded.data,
      blockNumber: 38041056n,
      transactionHash: `0x${'11'.repeat(32)}` as `0x${string}`,
      transactionIndex: 0,
      blockHash: `0x${'0'.repeat(64)}` as `0x${string}`,
      logIndex: 0,
      removed: false,
      ...overrides,
    }) as Log

  describe('TOPIC', () => {
    it('should match the keccak hash viem derives from the ABI', () => {
      expect(SwappedEvent.TOPIC.toString()).toBe(encoded.topics[0])
    })
  })

  describe('constructor', () => {
    it('should expose every field it was given', () => {
      const event = new SwappedEvent(
        new HexString(orderHash),
        new Address(maker),
        new Address(taker),
        new Address(tokenIn),
        new Address(tokenOut),
        amountIn,
        amountOut,
      )

      expect(event.orderHash.toString()).toBe(orderHash)
      expect(event.maker.toString()).toBe(maker.toLowerCase())
      expect(event.taker.toString()).toBe(taker.toLowerCase())
      expect(event.tokenIn.toString()).toBe(tokenIn.toLowerCase())
      expect(event.tokenOut.toString()).toBe(tokenOut.toLowerCase())
      expect(event.amountIn).toBe(amountIn)
      expect(event.amountOut).toBe(amountOut)
    })
  })

  describe('new', () => {
    it('should build an equivalent event from a data object', () => {
      const event = SwappedEvent.new({
        orderHash: new HexString(orderHash),
        maker: new Address(maker),
        taker: new Address(taker),
        tokenIn: new Address(tokenIn),
        tokenOut: new Address(tokenOut),
        amountIn,
        amountOut,
      })

      expect(event).toBeInstanceOf(SwappedEvent)
      expect(event.orderHash.toString()).toBe(orderHash)
      expect(event.maker.toString()).toBe(maker.toLowerCase())
      expect(event.amountOut).toBe(amountOut)
    })
  })

  describe('fromLog', () => {
    it('should decode a valid swapped event log', () => {
      const event = SwappedEvent.fromLog(buildLog())

      expect(event.orderHash.toString()).toBe(orderHash)
      expect(event.maker.toString()).toBe(maker.toLowerCase())
      expect(event.taker.toString()).toBe(taker.toLowerCase())
      expect(event.tokenIn.toString()).toBe(tokenIn.toLowerCase())
      expect(event.tokenOut.toString()).toBe(tokenOut.toLowerCase())
      expect(event.amountIn).toBe(amountIn)
      expect(event.amountOut).toBe(amountOut)
    })

    it('should preserve bigint amounts beyond Number.MAX_SAFE_INTEGER', () => {
      const huge = 2n ** 200n
      const event = SwappedEvent.fromLog(buildLog({ data: encodeData(huge, huge) }))

      expect(event.amountIn).toBe(huge)
      expect(event.amountOut).toBe(huge)
    })

    it('should throw on a topic belonging to a different event', () => {
      const log = buildLog({ topics: [`0x${'99'.repeat(32)}`] as Log['topics'] })

      expect(() => SwappedEvent.fromLog(log)).toThrow()
    })

    it('should throw on empty data', () => {
      expect(() => SwappedEvent.fromLog(buildLog({ data: '0x' }))).toThrow()
    })

    it('should throw on truncated data', () => {
      expect(() => SwappedEvent.fromLog(buildLog({ data: '0xdeadbeef' }))).toThrow()
    })
  })
})
