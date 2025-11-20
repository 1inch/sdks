// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { describe, it, expect } from 'vitest'
import type { Log } from 'viem'
import { Address, HexString } from '@1inch/sdk-core'
import { ShippedEvent } from './shipped-event'

describe('ShippedEvent', () => {
  const mockMaker = '0x1234567890123456789012345678901234567890'
  const mockApp = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  const mockStrategyHash = `0x${'0'.padStart(64, '0')}`
  const mockStrategy = `0x${'1'.padStart(128, '1')}`

  describe('constructor', () => {
    it('should create ShippedEvent instance', () => {
      const event = new ShippedEvent(
        new Address(mockMaker),
        new Address(mockApp),
        new HexString(mockStrategyHash),
        new HexString(mockStrategy),
      )

      expect(event.maker.toString()).toBe(mockMaker.toLowerCase())
      expect(event.app.toString()).toBe(mockApp.toLowerCase())
      expect(event.strategyHash.toString()).toBe(mockStrategyHash)
      expect(event.strategy.toString()).toBe(mockStrategy)
    })
  })

  describe('fromLog', () => {
    it('should decode valid shipped event log', () => {
      const log: Log = {
        address: '0x774d0b2991e1af5303ea6c054c78fa856d0f550c' as `0x${string}`,
        topics: [
          '0xdc3622e06fb145651f567d421c9ef261d71d43e3778b761907bc0d70d42e52b0' as `0x${string}`,
        ],
        data: '0x000000000000000000000000961da14c99217789106f0c246c0f66b49fe266ff000000000000000000000000774d0b2991e1af5303ea6c054c78fa856d0f550c2d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000961da14c99217789106f0c246c0f66b49fe266ff10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000001e1504000186a010001414535441424c452d313736323837313434373737300000' as `0x${string}`,
        blockNumber: 38041056n,
        transactionHash:
          '0x3643966559066142bd0ed23dd9f7834087c7c7a95930219a59924c37b9e4a1bc' as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      const event = ShippedEvent.fromLog(log)

      expect(event.maker.toString()).toBe('0x961da14c99217789106f0c246c0f66b49fe266ff')
      expect(event.app.toString()).toBe('0x774d0b2991e1af5303ea6c054c78fa856d0f550c')
      expect(event.strategyHash.toString()).toBe(
        '0x2d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e',
      )
      expect(event.strategy.toString().startsWith('0x')).toBe(true)
      expect(event.strategy.toString()).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000961da14c99217789106f0c246c0f66b49fe266ff10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000001e1504000186a010001414535441424c452d313736323837313434373737300000',
      )
    })

    it('should throw on invalid topic', () => {
      const log: Log = {
        address: '0x774d0b2991e1af5303ea6c054c78fa856d0f550c' as `0x${string}`,
        topics: ['0x0000asadasd' as `0x${string}`],
        data: '0x000000000000000000000000961da14c99217789106f0c246c0f66b49fe266ff000000000000000000000000774d0b2991e1af5303ea6c054c78fa856d0f550c2d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000961da14c99217789106f0c246c0f66b49fe266ff10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000001e1504000186a010001414535441424c452d313736323837313434373737300000' as `0x${string}`,
        blockNumber: 38041056n,
        transactionHash:
          '0x3643966559066142bd0ed23dd9f7834087c7c7a95930219a59924c37b9e4a1bc' as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      expect(() => ShippedEvent.fromLog(log)).toThrow()
    })

    it('should throw on missing data', () => {
      const log: Log = {
        address: mockApp as `0x${string}`,
        topics: [ShippedEvent.TOPIC.toString() as `0x${string}`],
        data: '0x' as `0x${string}`,
        blockNumber: 38041056n,
        transactionHash:
          '0x3643966559066142bd0ed23dd9f7834087c7c7a95930219a59924c37b9e4a1bc' as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      expect(() => ShippedEvent.fromLog(log)).toThrow()
    })

    it('should throw on invalid data format', () => {
      const log: Log = {
        address: '0x774d0b2991e1af5303ea6c054c78fa856d0f550c' as `0x${string}`,
        topics: [
          '0xdc3622e06fb145651f567d421c9ef261d71d43e3778b761907bc0d70d42e52b0' as `0x${string}`,
        ],
        data: '0xinvalid' as `0x${string}`,
        blockNumber: 38041056n,
        transactionHash:
          '0x3643966559066142bd0ed23dd9f7834087c7c7a95930219a59924c37b9e4a1bc' as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      expect(() => ShippedEvent.fromLog(log)).toThrow()
    })
  })
})
