// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { describe, it, expect } from 'vitest'
import type { Log } from 'viem'
import { Address, HexString } from '@1inch/sdk-core'
import { trim0x } from '@1inch/byte-utils'
import { DockedEvent } from './docked-event'

describe('DockedEvent', () => {
  const mockMaker = '0x961da14c99217789106f0c246c0f66b49fe266ff'
  const mockApp = '0x51b66446ebb060cb0571a6fcbccde855d091dc16'
  const mockStrategyHash = '0x2d142ba44ee9104f8cd702bfe7520e64eb8531c5e4e4ded80c6a93cf5a3d113e'

  describe('constructor', () => {
    it('should create DockedEvent instance', () => {
      const event = new DockedEvent(
        new Address(mockMaker),
        new Address(mockApp),
        new HexString(mockStrategyHash),
      )

      expect(event.maker.toString()).toBe(mockMaker.toLowerCase())
      expect(event.app.toString()).toBe(mockApp.toLowerCase())
      expect(event.strategyHash.toString()).toBe(mockStrategyHash)
    })
  })

  describe('fromLog', () => {
    it('should decode valid docked event log from real blockchain data', () => {
      const log: Log = {
        address: '0xfa3c23da986b3596ee7177434ad8e4406068a3e5' as `0x${string}`,
        topics: [
          '0xd173a1d140c154eb1ce9298d251d5eb8c4089cc2d16e70f1067bdc810c6fe004' as `0x${string}`,
        ],
        data: '0x0000000000000000000000008b83c50040c743e99bd47f4327bfcf7913c505b40000000000000000000000000cc85a15477539958d622a2735a3477d7d329c89fed4c945f2dc5747956337cf623dceacca130714540e70742e63456d3daf2400' as `0x${string}`,
        blockNumber: 23841073n,
        transactionHash:
          '0xb4231e80752dac59d01480454fe85cde374ea087176158ba0ac8315aecf3fde0' as `0x${string}`,
        transactionIndex: 0,
        blockHash:
          '0x23820c2a5de498bc0c87469392eac0c456ce3712ae3872cd32055b9a17a405c7' as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      const event = DockedEvent.fromLog(log)

      expect(event.maker.toString()).toBe('0x8b83c50040c743e99bd47f4327bfcf7913c505b4')
      expect(event.app.toString()).toBe('0x0cc85a15477539958d622a2735a3477d7d329c89')
      expect(event.strategyHash.toString()).toBe(
        '0xfed4c945f2dc5747956337cf623dceacca130714540e70742e63456d3daf2400',
      )
    })

    it('should decode valid docked event log', () => {
      const log: Log = {
        address: mockApp as `0x${string}`,
        topics: [DockedEvent.TOPIC.toString() as `0x${string}`],
        data: `0x${trim0x(mockMaker).padStart(64, '0')}${trim0x(mockApp).padStart(64, '0')}${trim0x(mockStrategyHash)}` as `0x${string}`,
        blockNumber: 1n,
        transactionHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      const event = DockedEvent.fromLog(log)

      expect(event.maker.toString()).toBe(mockMaker.toLowerCase())
      expect(event.app.toString()).toBe(mockApp.toLowerCase())
      expect(event.strategyHash.toString()).toBe(mockStrategyHash)
    })

    it('should throw on invalid topic', () => {
      const log: Log = {
        address: mockApp as `0x${string}`,
        topics: ['0xdeadbeef' as `0x${string}`],
        data: `0x${trim0x(mockMaker).padStart(64, '0')}${trim0x(mockApp).padStart(64, '0')}${trim0x(mockStrategyHash)}` as `0x${string}`,
        blockNumber: 1n,
        transactionHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      expect(() => DockedEvent.fromLog(log)).toThrow()
    })

    it('should throw on missing data', () => {
      const log: Log = {
        address: mockApp as `0x${string}`,
        topics: [DockedEvent.TOPIC.toString() as `0x${string}`],
        data: '0x' as `0x${string}`,
        blockNumber: 1n,
        transactionHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      expect(() => DockedEvent.fromLog(log)).toThrow()
    })

    it('should throw on invalid data format', () => {
      const log: Log = {
        address: mockApp as `0x${string}`,
        topics: [DockedEvent.TOPIC.toString() as `0x${string}`],
        data: '0xinvalid' as `0x${string}`,
        blockNumber: 1n,
        transactionHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        transactionIndex: 0,
        blockHash: `0x${'0'.padStart(64, '0')}` as `0x${string}`,
        logIndex: 0,
        removed: false,
      }

      expect(() => DockedEvent.fromLog(log)).toThrow()
    })
  })
})
