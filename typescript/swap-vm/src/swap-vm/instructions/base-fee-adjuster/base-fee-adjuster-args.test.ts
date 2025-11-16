// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { UINT_24_MAX, UINT_64_MAX, UINT_96_MAX } from '@1inch/byte-utils'
import { BaseFeeAdjusterArgs } from './base-fee-adjuster-args'

describe('BaseFeeAdjusterArgs', () => {
  it('should encode and decode base fee adjuster args', () => {
    const baseGasPrice = 20000000000n
    const ethToToken1Price = 3000n * 10n ** 18n
    const gasAmount = 150000n
    const maxPriceDecay = 990000000000000000n

    const args = new BaseFeeAdjusterArgs(baseGasPrice, ethToToken1Price, gasAmount, maxPriceDecay)

    const encoded = BaseFeeAdjusterArgs.CODER.encode(args)
    const decoded = BaseFeeAdjusterArgs.decode(encoded)

    expect(decoded.baseGasPrice).toBe(baseGasPrice)
    expect(decoded.ethToToken1Price).toBe(ethToToken1Price)
    expect(decoded.gasAmount).toBe(gasAmount)
    expect(decoded.maxPriceDecay).toBe(maxPriceDecay)
  })

  it('should handle maximum values', () => {
    const maxUint64 = UINT_64_MAX
    const maxUint96 = UINT_96_MAX
    const maxUint24 = UINT_24_MAX

    const args = new BaseFeeAdjusterArgs(maxUint64, maxUint96, maxUint24, maxUint64)

    const encoded = BaseFeeAdjusterArgs.CODER.encode(args)
    const decoded = BaseFeeAdjusterArgs.decode(encoded)

    expect(decoded.baseGasPrice).toBe(maxUint64)
    expect(decoded.ethToToken1Price).toBe(maxUint96)
    expect(decoded.gasAmount).toBe(maxUint24)
    expect(decoded.maxPriceDecay).toBe(maxUint64)
  })

  it('should convert to JSON correctly', () => {
    const args = new BaseFeeAdjusterArgs(
      20000000000n,
      3000n * 10n ** 18n,
      150000n,
      990000000000000000n,
    )
    const json = args.toJSON()

    expect(json).toEqual({
      baseGasPrice: '20000000000',
      ethToToken1Price: '3000000000000000000000',
      gasAmount: '150000',
      maxPriceDecay: '990000000000000000',
    })
  })

  it('should throw on invalid values', () => {
    const maxUint64 = (1n << 64n) - 1n
    const maxUint96 = (1n << 96n) - 1n
    const maxUint24 = (1n << 24n) - 1n

    expect(() => new BaseFeeAdjusterArgs(-1n, 100n, 100n, 100n)).toThrow()
    expect(() => new BaseFeeAdjusterArgs(maxUint64 + 1n, 100n, 100n, 100n)).toThrow()

    expect(() => new BaseFeeAdjusterArgs(100n, -1n, 100n, 100n)).toThrow()
    expect(() => new BaseFeeAdjusterArgs(100n, maxUint96 + 1n, 100n, 100n)).toThrow()

    expect(() => new BaseFeeAdjusterArgs(100n, 100n, -1n, 100n)).toThrow()
    expect(() => new BaseFeeAdjusterArgs(100n, 100n, maxUint24 + 1n, 100n)).toThrow()

    expect(() => new BaseFeeAdjusterArgs(100n, 100n, 100n, -1n)).toThrow()
    expect(() => new BaseFeeAdjusterArgs(100n, 100n, 100n, maxUint64 + 1n)).toThrow()
  })

  it('should handle realistic gas price scenarios', () => {
    const args = new BaseFeeAdjusterArgs(
      30000000000n,
      2500n * 10n ** 18n,
      200000n,
      950000000000000000n,
    )

    const encoded = BaseFeeAdjusterArgs.CODER.encode(args)
    const decoded = BaseFeeAdjusterArgs.decode(encoded)

    expect(decoded.baseGasPrice).toBe(30000000000n)
    expect(decoded.ethToToken1Price).toBe(2500n * 10n ** 18n)
    expect(decoded.gasAmount).toBe(200000n)
    expect(decoded.maxPriceDecay).toBe(950000000000000000n)
  })
})
