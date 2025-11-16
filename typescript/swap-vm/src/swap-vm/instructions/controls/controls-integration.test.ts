// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, AddressHalf } from '@1inch/sdk-core'
import { RegularProgramBuilder } from '../../programs'

describe('Controls Integration', () => {
  const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
  const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

  describe('RegularProgramBuilder', () => {
    it('should build program with jump instruction', () => {
      const builder = new RegularProgramBuilder()

      const program = builder.jump({ nextPC: 100n }).build()

      const hex = program.toString()
      expect(hex.startsWith('0x0a')).toBe(true)
      expect(hex.substring(4, 6)).toBe('02')
      expect(hex.substring(6, 10)).toBe('0064')
    })

    it('should build program with conditional jumps', () => {
      const builder = new RegularProgramBuilder()

      const program = builder
        .jumpIfTokenIn({ tokenTail: AddressHalf.fromAddress(USDC), nextPC: 50n })
        .jumpIfTokenOut({ tokenTail: AddressHalf.fromAddress(WETH), nextPC: 75n })
        .build()

      const hex = program.toString()
      expect(hex.substring(0, 4)).toBe('0x0b')
      expect(hex.length).toBeGreaterThan(10)
    })

    it('should build program with token balance check', () => {
      const builder = new RegularProgramBuilder()

      const program = builder.onlyTakerTokenBalanceNonZero({ token: USDC }).build()

      const hex = program.toString()
      expect(hex.substring(0, 4)).toBe('0x0e')
      expect(hex.substring(4, 6)).toBe('14')
      expect(hex.substring(6, 46).toLowerCase()).toBe(USDC.toString().substring(2).toLowerCase())
    })

    it('should build program with token balance minimum check', () => {
      const builder = new RegularProgramBuilder()
      const minAmount = 1000000n * 10n ** 6n

      const program = builder
        .onlyTakerTokenBalanceGte({
          token: WETH,
          minAmount: minAmount,
        })
        .build()

      const hex = program.toString()

      expect(hex.substring(0, 4)).toBe('0x0f')
      expect(hex.substring(4, 6)).toBe('34')
    })

    it('should build program with token supply share check', () => {
      const builder = new RegularProgramBuilder()
      const minShare = 100000000000000000n

      const program = builder
        .onlyTakerTokenSupplyShareGte({
          token: USDC,
          minShareE18: minShare,
        })
        .build()

      const hex = program.toString()

      expect(hex.substring(0, 4)).toBe('0x10')
      expect(hex.substring(4, 6)).toBe('1c')
    })
  })
})
