// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { UINT_16_MAX, UINT_64_MAX, UINT_8_MAX } from '@1inch/byte-utils'
import { OraclePriceAdjusterArgs } from './oracle-price-adjuster-args'

describe('OraclePriceAdjusterArgs', () => {
  const oracle = new Address('0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419')

  it('should encode and decode oracle price adjuster args', () => {
    const maxPriceDecay = 950000000000000000n
    const maxStaleness = 3600n
    const oracleDecimals = 8n

    const args = new OraclePriceAdjusterArgs(maxPriceDecay, maxStaleness, oracleDecimals, oracle)

    const encoded = OraclePriceAdjusterArgs.CODER.encode(args)
    const decoded = OraclePriceAdjusterArgs.decode(encoded)

    expect(decoded.maxPriceDecay).toBe(maxPriceDecay)
    expect(decoded.maxStaleness).toBe(maxStaleness)
    expect(decoded.oracleDecimals).toBe(oracleDecimals)
    expect(decoded.oracleAddress.toString()).toBe(oracle.toString())
  })

  it('should handle maximum values', () => {
    const maxUint16 = UINT_16_MAX
    const maxUint8 = UINT_8_MAX

    const maxPriceDecay = 999999999999999999n // just under 1e18

    const args = new OraclePriceAdjusterArgs(maxPriceDecay, maxUint16, maxUint8, oracle)

    const encoded = OraclePriceAdjusterArgs.CODER.encode(args)
    const decoded = OraclePriceAdjusterArgs.decode(encoded)

    expect(decoded.maxPriceDecay).toBe(maxPriceDecay)
    expect(decoded.maxStaleness).toBe(maxUint16)
    expect(decoded.oracleDecimals).toBe(maxUint8)
  })

  it('should convert to JSON correctly', () => {
    const args = new OraclePriceAdjusterArgs(950000000000000000n, 3600n, 8n, oracle)
    const json = args.toJSON()

    expect(json).toEqual({
      maxPriceDecay: '950000000000000000',
      maxStaleness: '3600',
      oracleDecimals: '8',
      oracleAddress: oracle.toString(),
    })
  })

  it('should throw on invalid values', () => {
    const maxUint64 = UINT_64_MAX
    const maxUint16 = UINT_16_MAX
    const maxUint8 = UINT_8_MAX

    expect(() => new OraclePriceAdjusterArgs(-1n, 100n, 8n, oracle)).toThrow()
    expect(() => new OraclePriceAdjusterArgs(maxUint64 + 1n, 100n, 8n, oracle)).toThrow()
    expect(() => new OraclePriceAdjusterArgs(1000000000000000000n, 100n, 8n, oracle)).toThrow(
      'less than 1e18',
    )

    expect(() => new OraclePriceAdjusterArgs(100n, -1n, 8n, oracle)).toThrow()
    expect(() => new OraclePriceAdjusterArgs(100n, maxUint16 + 1n, 8n, oracle)).toThrow()

    expect(() => new OraclePriceAdjusterArgs(100n, 100n, -1n, oracle)).toThrow()
    expect(() => new OraclePriceAdjusterArgs(100n, 100n, maxUint8 + 1n, oracle)).toThrow()
  })

  it('should enforce max price decay < 1e18', () => {
    expect(() => new OraclePriceAdjusterArgs(1000000000000000000n, 100n, 8n, oracle)).toThrow()
    expect(() => new OraclePriceAdjusterArgs(2000000000000000000n, 100n, 8n, oracle)).toThrow()

    expect(() => new OraclePriceAdjusterArgs(999999999999999999n, 100n, 8n, oracle)).not.toThrow()
  })
})
