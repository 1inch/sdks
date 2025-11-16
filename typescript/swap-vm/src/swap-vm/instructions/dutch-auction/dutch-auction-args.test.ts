// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { DutchAuctionArgs } from './dutch-auction-args'

describe('DutchAuctionArgs', () => {
  it('should encode and decode dutch auction args', () => {
    const startTime = 1700000000n
    const duration = 3600n
    const decayFactor = 999000000n // 0.999 (0.1% decay)
    const args = new DutchAuctionArgs(startTime, duration, decayFactor)

    const encoded = DutchAuctionArgs.CODER.encode(args)
    expect(encoded.toString().length).toBeGreaterThan(2)

    const decoded = DutchAuctionArgs.decode(encoded)
    expect(decoded.startTime).toBe(startTime)
    expect(decoded.duration).toBe(duration)
    expect(decoded.decayFactor).toBe(decayFactor)
  })

  it('should handle maximum values', () => {
    const maxUint40 = (1n << 40n) - 1n
    const maxUint16 = 65535n
    const maxDecayFactor = 999999999n

    const args = new DutchAuctionArgs(maxUint40, maxUint16, maxDecayFactor)

    const encoded = DutchAuctionArgs.CODER.encode(args)
    const decoded = DutchAuctionArgs.decode(encoded)

    expect(decoded.startTime).toBe(maxUint40)
    expect(decoded.duration).toBe(maxUint16)
    expect(decoded.decayFactor).toBe(maxDecayFactor)
  })

  it('should convert to JSON correctly', () => {
    const args = new DutchAuctionArgs(1700000000n, 3600n, 999000000n)
    const json = args.toJSON()

    expect(json).toEqual({
      startTime: '1700000000',
      duration: '3600',
      decayFactor: '999000000',
    })
  })

  it('should throw on invalid values', () => {
    const maxUint40 = (1n << 40n) - 1n
    const maxUint16 = 65535n
    const maxUint32 = (1n << 32n) - 1n

    expect(() => new DutchAuctionArgs(-1n, 100n, 500000000n)).toThrow()
    expect(() => new DutchAuctionArgs(maxUint40 + 1n, 100n, 500000000n)).toThrow()

    expect(() => new DutchAuctionArgs(100n, -1n, 500000000n)).toThrow()
    expect(() => new DutchAuctionArgs(100n, maxUint16 + 1n, 500000000n)).toThrow()

    expect(() => new DutchAuctionArgs(100n, 100n, -1n)).toThrow()
    expect(() => new DutchAuctionArgs(100n, 100n, maxUint32 + 1n)).toThrow()
  })
})
