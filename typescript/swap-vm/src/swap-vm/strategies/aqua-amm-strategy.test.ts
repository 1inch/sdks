// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { afterEach, describe, it, expect, vi } from 'vitest'
import { UINT_64_MAX } from '@1inch/byte-utils'
import { AquaXYCAmmStrategy } from './aqua-xyc-amm-strategy'

describe('AquaAMMStrategy', () => {
  describe('withRandomSalt', () => {
    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    })

    it('should set a uint64 salt from crypto.getRandomValues', () => {
      const getRandomValues = vi
        .spyOn(globalThis.crypto, 'getRandomValues')
        .mockImplementation((array) => {
          if (array instanceof BigUint64Array) {
            array[0] = 0x0102030405060708n
          }

          return array
        })
      const strategy = AquaXYCAmmStrategy.new()

      expect(strategy.withRandomSalt()).toBe(strategy)
      expect(getRandomValues).toHaveBeenCalledOnce()
      expect(strategy.salt).toBe(0x0102030405060708n)
      expect(strategy.build().toString()).toBe('0x1100' + '1408' + '0102030405060708')
    })

    it('should draw a different salt on every call', () => {
      const salts = Array.from({ length: 8 }, () => AquaXYCAmmStrategy.new().withRandomSalt().salt)

      expect(new Set(salts).size).toBe(salts.length)
      expect(salts.every((salt) => salt !== undefined && salt <= UINT_64_MAX)).toBe(true)
    })

    it('should require the Web Crypto API', () => {
      vi.stubGlobal('crypto', undefined)

      expect(() => AquaXYCAmmStrategy.new().withRandomSalt()).toThrow(
        'globalThis.crypto.getRandomValues is required to generate a random salt',
      )
    })
  })
})
