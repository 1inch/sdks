// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { describe, it, expect } from 'vitest'
import type { Log } from 'viem'
import { Address, HexString } from '@1inch/sdk-core'
import { trim0x } from '@1inch/byte-utils'
import { PulledEvent } from './pulled-event'

describe('PulledEvent', () => {
  const mockMaker = '0x961da14c99217789106f0c246c0f66b49fe266ff'
  const mockApp = '0x51b66446ebb060cb0571a6fcbccde855d091dc16'
  const mockStrategyHash = '0x2d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e'
  const mockToken = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
  const mockAmount = 750000n

  describe('constructor', () => {
    it('should create PulledEvent instance', () => {
      const event = new PulledEvent(
        new Address(mockMaker),
        new Address(mockApp),
        new HexString(mockStrategyHash),
        new Address(mockToken),
        mockAmount,
      )

      expect(event.maker.toString()).toBe(mockMaker.toLowerCase())
      expect(event.app.toString()).toBe(mockApp.toLowerCase())
      expect(event.strategyHash.toString()).toBe(mockStrategyHash)
      expect(event.token.toString()).toBe(mockToken.toLowerCase())
      expect(event.amount).toBe(mockAmount)
    })
  })

  describe('fromLog', () => {
    it('should decode valid pulled event log with realistic blockchain data', () => {
      const log: Log = {
        address: '0x51b66446Ebb060cb0571a6fcbCcde855D091DC16' as `0x${string}`,
        topics: [PulledEvent.TOPIC.toString() as `0x${string}`],
        data: '0x000000000000000000000000961da14c99217789106f0c246c0f66b49fe266ff00000000000000000000000051b66446ebb060cb0571a6fcbccde855d091dc162d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda0291300000000000000000000000000000000000000000000000000000000000b71b0' as `0x${string}`,
        blockNumber: 38041057n,
        transactionHash: ('0x' + '2'.padStart(64, '0')) as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      const event = PulledEvent.fromLog(log)

      expect(event.maker.toString()).toBe('0x961da14c99217789106f0c246c0f66b49fe266ff')
      expect(event.app.toString()).toBe('0x51b66446ebb060cb0571a6fcbccde855d091dc16')
      expect(event.strategyHash.toString()).toBe(
        '0x2d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e',
      )
      expect(event.token.toString()).toBe('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913')
      expect(event.amount).toBe(750000n)
    })

    it('should decode valid pulled event log', () => {
      const log: Log = {
        address: mockApp as `0x${string}`,
        topics: [PulledEvent.TOPIC.toString() as `0x${string}`],
        data: `0x${trim0x(mockMaker).padStart(64, '0')}${trim0x(mockApp).padStart(64, '0')}${trim0x(mockStrategyHash)}${trim0x(mockToken).padStart(64, '0')}${mockAmount.toString(16).padStart(64, '0')}` as `0x${string}`,
        blockNumber: 1n,
        transactionHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      const event = PulledEvent.fromLog(log)

      expect(event.maker.toString()).toBe(mockMaker.toLowerCase())
      expect(event.app.toString()).toBe(mockApp.toLowerCase())
      expect(event.strategyHash.toString()).toBe(mockStrategyHash)
      expect(event.token.toString()).toBe(mockToken.toLowerCase())
      expect(event.amount).toBe(mockAmount)
    })

    it('should decode pulled event with large amount', () => {
      const largeAmount = 1000000000000000000n

      const log: Log = {
        address: mockApp as `0x${string}`,
        topics: [PulledEvent.TOPIC.toString() as `0x${string}`],
        data: `0x${trim0x(mockMaker).padStart(64, '0')}${trim0x(mockApp).padStart(64, '0')}${trim0x(mockStrategyHash)}${trim0x(mockToken).padStart(64, '0')}${largeAmount.toString(16).padStart(64, '0')}` as `0x${string}`,
        blockNumber: 1n,
        transactionHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      const event = PulledEvent.fromLog(log)
      expect(event.amount).toBe(largeAmount)
    })

    it('should throw on invalid topic', () => {
      const log: Log = {
        address: mockApp as `0x${string}`,
        topics: ['0xdeadbeef' as `0x${string}`],
        data: `0x${'0'.padStart(320, '0')}` as `0x${string}`,
        blockNumber: 1n,
        transactionHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      expect(() => PulledEvent.fromLog(log)).toThrow()
    })

    it('should throw on missing data', () => {
      const log: Log = {
        address: mockApp as `0x${string}`,
        topics: [PulledEvent.TOPIC.toString() as `0x${string}`],
        data: '0x' as `0x${string}`,
        blockNumber: 1n,
        transactionHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      expect(() => PulledEvent.fromLog(log)).toThrow()
    })

    it('should throw on invalid data format', () => {
      const log: Log = {
        address: mockApp as `0x${string}`,
        topics: [PulledEvent.TOPIC.toString() as `0x${string}`],
        data: '0xinvalid' as `0x${string}`,
        blockNumber: 1n,
        transactionHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      expect(() => PulledEvent.fromLog(log)).toThrow()
    })
  })
})
