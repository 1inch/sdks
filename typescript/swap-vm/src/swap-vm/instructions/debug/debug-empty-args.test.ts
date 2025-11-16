// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { HexString } from '@1inch/sdk-core'
import { DebugEmptyArgs } from './debug-empty-args'

describe('DebugEmptyArgs', () => {
  const coder = DebugEmptyArgs.CODER

  describe('encoding/decoding', () => {
    it('should encode DebugEmptyArgs to empty hex string', () => {
      const args = new DebugEmptyArgs()
      const encoded = coder.encode(args)

      expect(encoded).toEqual(HexString.EMPTY)
      expect(encoded.toString()).toBe('0x')
    })

    it('should decode empty hex string to DebugEmptyArgs', () => {
      const decoded = coder.decode(HexString.EMPTY)

      expect(decoded).toBeInstanceOf(DebugEmptyArgs)
      expect(decoded.toJSON()).toBeNull()
    })

    it('should handle decode via static method', () => {
      const decoded = DebugEmptyArgs.decode(HexString.EMPTY)

      expect(decoded).toBeInstanceOf(DebugEmptyArgs)
      expect(decoded.toJSON()).toBeNull()
    })
  })

  describe('JSON serialization', () => {
    it('should serialize to null', () => {
      const args = new DebugEmptyArgs()

      expect(args.toJSON()).toBeNull()
    })
  })

  describe('CODER', () => {
    it('should expose static CODER property', () => {
      expect(DebugEmptyArgs.CODER).toBeDefined()
      expect(DebugEmptyArgs.CODER).toHaveProperty('encode')
      expect(DebugEmptyArgs.CODER).toHaveProperty('decode')
    })
  })
})
