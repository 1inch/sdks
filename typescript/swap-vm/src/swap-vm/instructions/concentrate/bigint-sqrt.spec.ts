// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { UINT_256_MAX } from '@1inch/byte-utils'
import { bigintSqrt } from './bigint-sqrt'

describe('bigintSqrt', () => {
  it('correct for 0-1000', () => {
    for (let i = 0; i <= 1000; i++) {
      expect(bigintSqrt(BigInt(i))).toBe(BigInt(Math.floor(Math.sqrt(i))))
    }
  })

  describe('correct for all even powers of 2', () => {
    for (let i = 0; i < 256; i++) {
      it(`2^${i * 2}`, () => {
        const root = 2n ** BigInt(i)
        const rootSquared = root * root
        expect(bigintSqrt(rootSquared)).toBe(root)
      })
    }
  })

  it('correct for UINT_256_MAX', () => {
    expect(bigintSqrt(UINT_256_MAX)).toBe(BigInt('340282366920938463463374607431768211455'))
  })
})
