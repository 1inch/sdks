// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { HexString } from '@1inch/sdk-core'
import { PrintAmountForSwapArgs } from './print-amount-for-swap'
import { PrintContextArgs } from './print-context'
import { PrintFreeMemoryPointerArgs } from './print-free-memory-pointer'
import { PrintGasLeftArgs } from './print-gas-left'
import { PrintSwapQueryArgs } from './print-swap-query'
import { PrintSwapRegistersArgs } from './print-swap-registers'

const debugArgs = [
  PrintAmountForSwapArgs,
  PrintContextArgs,
  PrintFreeMemoryPointerArgs,
  PrintGasLeftArgs,
  PrintSwapQueryArgs,
  PrintSwapRegistersArgs,
]

describe('debug print args', () => {
  it.each(debugArgs)('should encode, decode and serialize %s', (Ctor) => {
    const args = new Ctor()

    expect(Ctor.CODER.encode(args).toString()).toBe('0x')
    expect(Ctor.decode(HexString.EMPTY)).toBeInstanceOf(Ctor)
    expect(args.toJSON()).toBeNull()
  })
})
