// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { describe, it, expect } from 'vitest'
import type { Log } from 'viem'
import { Address, HexString } from '@1inch/sdk-core'
import { PushedEvent } from './pushed-event'

describe('PushedEvent', () => {
  const mockMaker = '0x961da14c99217789106f0c246c0f66b49fe266ff'
  const mockApp = '0x51b66446ebb060cb0571a6fcbccde855d091dc16'
  const mockStrategyHash = '0x2d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e'
  const mockToken = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
  const mockAmount = 1000000n

  describe('constructor', () => {
    it('should create PushedEvent instance', () => {
      const event = new PushedEvent(
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
    it('should decode valid pushed event log from real blockchain data', () => {
      const log: Log = {
        address: '0x51b66446Ebb060cb0571a6fcbCcde855D091DC16' as `0x${string}`,
        topics: [
          '0x3f18354abbd5306dd1665c2c90f614a4559e39dd620d04fbe5458e613b6588f3' as `0x${string}`,
        ],
        data: '0x000000000000000000000000961da14c99217789106f0c246c0f66b49fe266ff000000000000000000000000774d0b2991e1af5303ea6c054c78fa856d0f550c2d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda0291300000000000000000000000000000000000000000000000000000000000f4240' as `0x${string}`,
        blockNumber: 38041056n,
        transactionHash:
          '0x3643966559066142bd0ed23dd9f7834087c7c7a95930219a59924c37b9e4a1bc' as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 2,
        removed: false,
      }

      const event = PushedEvent.fromLog(log)

      expect(event.maker.toString()).toBe('0x961da14c99217789106f0c246c0f66b49fe266ff')
      expect(event.app.toString()).toBe('0x774d0b2991e1af5303ea6c054c78fa856d0f550c')
      expect(event.strategyHash.toString()).toBe(
        '0x2d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e',
      )
      expect(event.token.toString()).toBe('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913')
      expect(event.amount).toBe(1000000n)
    })

    it('should decode multiple pushed events from same transaction', () => {
      const logs: Log[] = [
        {
          address: '0x51b66446ebb060cb0571a6fcbccde855d091dc16' as `0x${string}`,
          topics: [
            '0x3f18354abbd5306dd1665c2c90f614a4559e39dd620d04fbe5458e613b6588f3' as `0x${string}`,
          ],
          data: '0x000000000000000000000000961da14c99217789106f0c246c0f66b49fe266ff000000000000000000000000774d0b2991e1af5303ea6c054c78fa856d0f550c2d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda0291300000000000000000000000000000000000000000000000000000000000f4240' as `0x${string}`,
          blockNumber: 38041056n,
          transactionHash:
            '0x3643966559066142bd0ed23dd9f7834087c7c7a95930219a59924c37b9e4a1bc' as `0x${string}`,
          transactionIndex: 0,
          blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
          logIndex: 0,
          removed: false,
        },
        {
          address: '0x51b66446ebb060cb0571a6fcbccde855d091dc16' as `0x${string}`,
          topics: [
            '0x3f18354abbd5306dd1665c2c90f614a4559e39dd620d04fbe5458e613b6588f3' as `0x${string}`,
          ],
          data: '0x000000000000000000000000961da14c99217789106f0c246c0f66b49fe266ff000000000000000000000000774d0b2991e1af5303ea6c054c78fa856d0f550c2d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000000000000000000000000000000000000001e848' as `0x${string}`,
          blockNumber: 38041056n,
          transactionHash:
            '0x3643966559066142bd0ed23dd9f7834087c7c7a95930219a59924c37b9e4a1bc' as `0x${string}`,
          transactionIndex: 0,
          blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
          logIndex: 1,
          removed: false,
        },
        {
          address: '0x51b66446ebb060cb0571a6fcbccde855d091dc16' as `0x${string}`,
          topics: [
            '0x3f18354abbd5306dd1665c2c90f614a4559e39dd620d04fbe5458e613b6588f3' as `0x${string}`,
          ],
          data: '0x000000000000000000000000961da14c99217789106f0c246c0f66b49fe266ff000000000000000000000000774d0b2991e1af5303ea6c054c78fa856d0f550c2d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000000000000000000000000000000000000002dc6c' as `0x${string}`,
          blockNumber: 38041056n,
          transactionHash:
            '0x3643966559066142bd0ed23dd9f7834087c7c7a95930219a59924c37b9e4a1bc' as `0x${string}`,
          transactionIndex: 0,
          blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
          logIndex: 2,
          removed: false,
        },
      ]

      const events = logs.map((log) => PushedEvent.fromLog(log))

      expect(events).toHaveLength(3)

      events.forEach((event) => {
        expect(event.maker.toString()).toBe('0x961da14c99217789106f0c246c0f66b49fe266ff')
        expect(event.app.toString()).toBe('0x774d0b2991e1af5303ea6c054c78fa856d0f550c')
        expect(event.strategyHash.toString()).toBe(
          '0x2d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e',
        )
        expect(event.token.toString()).toBe('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913')
      })

      expect(events[0].amount).toBe(1000000n)
      expect(events[1].amount).toBe(125000n)
      expect(events[2].amount).toBe(187500n)
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

      expect(() => PushedEvent.fromLog(log)).toThrow()
    })

    it('should throw on missing data', () => {
      const log: Log = {
        address: mockApp as `0x${string}`,
        topics: [PushedEvent.TOPIC.toString() as `0x${string}`],
        data: '0x' as `0x${string}`,
        blockNumber: 1n,
        transactionHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      expect(() => PushedEvent.fromLog(log)).toThrow()
    })

    it('should throw on invalid data format', () => {
      const log: Log = {
        address: mockApp as `0x${string}`,
        topics: [PushedEvent.TOPIC.toString() as `0x${string}`],
        data: '0xnotvalid' as `0x${string}`,
        blockNumber: 1n,
        transactionHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      expect(() => PushedEvent.fromLog(log)).toThrow()
    })
  })
})
