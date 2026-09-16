// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { HexString } from '@1inch/sdk-core'
import { EMPTY_OPCODE } from './empty'
import { Instruction } from './instruction'

describe('EMPTY_OPCODE', () => {
  it('should encode empty args and expose instruction JSON', () => {
    const args = EMPTY_OPCODE.coder.decode(HexString.EMPTY)
    const encoded = EMPTY_OPCODE.coder.encode(args)
    const instruction = EMPTY_OPCODE.createIx(args)

    expect(encoded.toString()).toBe('0x')
    expect(args.toJSON()).toBeNull()
    expect(instruction).toBeInstanceOf(Instruction)
    expect(instruction.toJSON()).toEqual({
      opcode: EMPTY_OPCODE.id.toString(),
      args: null,
    })
  })
})
