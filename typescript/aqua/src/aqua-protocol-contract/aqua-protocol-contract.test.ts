// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { describe, it, expect } from 'vitest'
import { Address, HexString } from '@1inch/sdk-core'
import { decodeFunctionData } from 'viem'
import type { DockArgs, ShipArgs } from './types'
import { AquaProtocolContract } from './aqua-protocol-contract'
import { AQUA_ABI } from '../abi/Aqua.abi'

describe('AquaProtocolContract', () => {
  const mockApp = Address.fromBigInt(1n)
  const mockToken = Address.fromBigInt(3n)
  const mockContractAddress = Address.fromBigInt(5n)

  const mockStrategy = new HexString('0x01020304')
  const mockStrategyHash = AquaProtocolContract.calculateStrategyHash(mockStrategy)
  const mockAmount = BigInt(1000)
  const mockAmounts = [mockAmount, BigInt(2000)]
  const mockTokens = [mockToken, Address.fromBigInt(6n)]

  describe('encodeShipCallData', () => {
    it('should encode ship function call data correctly', () => {
      const args: ShipArgs = {
        app: mockApp,
        strategy: mockStrategy,
        amountsAndTokens: [
          { token: mockTokens[0], amount: mockAmounts[0] },
          { token: mockTokens[1], amount: mockAmounts[1] },
        ],
      }

      const result = AquaProtocolContract.encodeShipCallData(args)

      expect(result).toBeDefined()
      expect(result.toString()).toMatch(/^0x[0-9a-fA-F]+$/)
    })

    describe('amount bounds (Aqua stores balances as uint248)', () => {
      const UINT_248_MAX = 2n ** 248n - 1n

      const shipArgs = (amount: bigint): ShipArgs => ({
        app: mockApp,
        strategy: mockStrategy,
        amountsAndTokens: [
          { token: mockTokens[0], amount: mockAmounts[0] },
          { token: mockTokens[1], amount },
        ],
      })

      it('should accept 0 and 2^248 - 1', () => {
        for (const amount of [0n, UINT_248_MAX]) {
          const { args } = decodeFunctionData({
            abi: AQUA_ABI,
            data: AquaProtocolContract.encodeShipCallData(shipArgs(amount)).toString(),
          })

          expect(args[3]).toEqual([mockAmounts[0], amount])
        }
      })

      it('should reject 2^248', () => {
        expect(() => AquaProtocolContract.encodeShipCallData(shipArgs(UINT_248_MAX + 1n))).toThrow(
          `Invalid amount for token ${mockTokens[1]}: ${UINT_248_MAX + 1n}. ` +
            'Must be >= 0 and <= UINT_248_MAX (2^248 - 1)',
        )
      })

      it('should reject negative amounts', () => {
        expect(() => AquaProtocolContract.encodeShipCallData(shipArgs(-1n))).toThrow(
          `Invalid amount for token ${mockTokens[1]}: -1. Must be >= 0`,
        )
      })

      it('should validate amounts in buildShipTx and ship', () => {
        const aqua = new AquaProtocolContract(mockContractAddress)

        expect(() => AquaProtocolContract.buildShipTx(mockContractAddress, shipArgs(-1n))).toThrow(
          'Invalid amount',
        )
        expect(() => aqua.ship(shipArgs(UINT_248_MAX + 1n))).toThrow('Invalid amount')
      })
    })
  })

  describe('encodeDockCallData', () => {
    it('should encode dock function call data correctly', () => {
      const args: DockArgs = {
        app: mockApp,
        strategyHash: mockStrategyHash,
        tokens: mockTokens,
      }

      const result = AquaProtocolContract.encodeDockCallData(args)

      expect(result).toBeDefined()
      expect(result.toString()).toMatch(/^0x[0-9a-fA-F]+$/)
    })
  })

  describe('buildShipTx', () => {
    it('should build ship transaction correctly', () => {
      const args: ShipArgs = {
        app: mockApp,
        strategy: mockStrategy,
        amountsAndTokens: [
          { token: mockTokens[0], amount: mockAmounts[0] },
          { token: mockTokens[1], amount: mockAmounts[1] },
        ],
      }

      const aqua = new AquaProtocolContract(mockContractAddress)
      const tx0 = aqua.ship(args)

      const tx = AquaProtocolContract.buildShipTx(mockContractAddress, args)

      expect(tx).toBeDefined()
      expect(tx).toStrictEqual(tx0)
      expect(tx.to).toBe(mockContractAddress.toString())
      expect(tx.data.startsWith('0x')).toBe(true)
      expect(tx.value).toBe(0n)
    })
  })

  describe('buildDockTx', () => {
    it('should build dock transaction correctly', () => {
      const args: DockArgs = {
        app: mockApp,
        strategyHash: mockStrategyHash,
        tokens: mockTokens,
      }

      const aqua = new AquaProtocolContract(mockContractAddress)
      const tx0 = aqua.dock(args)

      const tx = AquaProtocolContract.buildDockTx(mockContractAddress, args)

      expect(tx).toBeDefined()
      expect(tx0).toStrictEqual(tx)
      expect(tx.to).toBe(mockContractAddress.toString())
      expect(tx.data.startsWith('0x')).toBe(true)
      expect(tx.value).toBe(0n)
    })
  })

  describe('calculateStrategyHash', () => {
    it('should calculate strategy hash correctly', () => {
      const strategy = new HexString('0x01020304')

      const hash = AquaProtocolContract.calculateStrategyHash(strategy)

      expect(hash).toBeDefined()
      expect(hash.toString()).toMatch(/^0x[0-9a-fA-F]+$/)
      expect(hash.toString().length).toBe(66)
    })

    it('should produce consistent hashes for the same input', () => {
      const strategy = new HexString('0x01020304')

      const hash1 = AquaProtocolContract.calculateStrategyHash(strategy)
      const hash2 = AquaProtocolContract.calculateStrategyHash(strategy)

      expect(hash1.toString()).toBe(hash2.toString())
    })

    it('should produce different hashes for different inputs', () => {
      const strategy1 = new HexString('0x01020304')
      const strategy2 = new HexString('0x05060708')

      const hash1 = AquaProtocolContract.calculateStrategyHash(strategy1)
      const hash2 = AquaProtocolContract.calculateStrategyHash(strategy2)

      expect(hash1.toString()).not.toBe(hash2.toString())
    })
  })
})
