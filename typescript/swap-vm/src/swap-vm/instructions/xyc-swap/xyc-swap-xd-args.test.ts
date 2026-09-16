// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { HexString } from '@1inch/sdk-core'
import { XycSwapXDArgs } from './xyc-swap-xd-args'

describe('XycSwapXDArgs', () => {
  it('should decode empty data and serialize to an empty object', () => {
    const decoded = XycSwapXDArgs.decode(new HexString('0x'))

    expect(decoded.toJSON()).toEqual({})
    expect(XycSwapXDArgs.CODER.encode(decoded).toString()).toBe('0x')
  })
})
