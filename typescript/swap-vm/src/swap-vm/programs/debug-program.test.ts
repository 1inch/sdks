// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { RegularProgramBuilder } from './regular-program-builder'
import { AquaProgramBuilder } from './aqua-program-builder'
import { SwapVmProgram } from './swap-vm-program'
import * as debug from '../instructions/debug/opcodes'
import { EMPTY_OPCODE } from '../instructions/empty'

type DebugProgramBuilder = RegularProgramBuilder | AquaProgramBuilder

const DEBUG_METHODS = [
  ['debugPrintSwapRegisters', '0x0000'],
  ['debugPrintSwapQuery', '0x0100'],
  ['debugPrintContext', '0x0200'],
  ['debugPrintFreeMemoryPointer', '0x0300'],
  ['debugPrintGasLeft', '0x0400'],
] as const

const BUILDERS = [
  {
    name: 'RegularProgramBuilder',
    create: (): DebugProgramBuilder => new RegularProgramBuilder(),
    mixedProgram: '0x0a02000a000016000200',
  },
  {
    name: 'AquaProgramBuilder',
    create: (): DebugProgramBuilder => new AquaProgramBuilder(),
    mixedProgram: '0x0a02000a000011000200',
  },
]

describe('Debug Program Functionality', () => {
  describe.each(BUILDERS)('$name', ({ create, mixedProgram }) => {
    it('should install the Debug._injectDebugOpcodes layout with withDebug()', () => {
      const ixsSet = create().withDebug()['ixsSet']

      expect(ixsSet[0]).toBe(debug.printSwapRegisters)
      expect(ixsSet[1]).toBe(debug.printSwapQuery)
      expect(ixsSet[2]).toBe(debug.printContext)
      expect(ixsSet[3]).toBe(debug.printFreeMemoryPointer)
      expect(ixsSet[4]).toBe(debug.printGasLeft)
      expect(ixsSet.slice(5, 10).every((opcode) => opcode === EMPTY_OPCODE)).toBe(true)
      expect(ixsSet).not.toContain(debug.printAmountForSwap)
    })

    it.each(DEBUG_METHODS)('should encode %s as %s', (method, expected) => {
      expect(create().withDebug()[method]().build().toString()).toBe(expected)
    })

    it('should allow chaining of debug methods after withDebug()', () => {
      const builder = create()

      const result = builder
        .withDebug()
        .debugPrintSwapRegisters()
        .debugPrintSwapQuery()
        .debugPrintContext()
        .debugPrintFreeMemoryPointer()
        .debugPrintGasLeft()

      expect(result).toBe(builder)

      const instructions = builder.getInstructions()

      expect(instructions).toHaveLength(5)
      expect(instructions[0].opcode).toBe(debug.printSwapRegisters)
      expect(instructions[1].opcode).toBe(debug.printSwapQuery)
      expect(instructions[2].opcode).toBe(debug.printContext)
      expect(instructions[3].opcode).toBe(debug.printFreeMemoryPointer)
      expect(instructions[4].opcode).toBe(debug.printGasLeft)
      expect(builder.build().toString()).toBe('0x00000100020003000400')
    })

    it('should reject debug instructions if debug mode is not enabled', () => {
      expect(() => create().debugPrintSwapRegisters()).toThrow(
        'Invalid opcode Symbol(Debug.printSwapRegisters)',
      )
      expect(() => create().debugPrintGasLeft()).toThrow(
        'Invalid opcode Symbol(Debug.printGasLeft)',
      )
    })

    it('should reject debugPrintAmountForSwap() as unsupported by the debug routers', () => {
      const builder = create().withDebug()

      expect(() => builder.debugPrintAmountForSwap()).toThrow(
        'debugPrintAmountForSwap() is not supported by the SwapVM debug routers',
      )
      expect(() =>
        builder.add(debug.printAmountForSwap.createIx(new debug.PrintAmountForSwapArgs())),
      ).toThrow('Invalid opcode Symbol(debug.printAmountForSwap)')
      expect(builder.getInstructions()).toHaveLength(0)
    })

    it('should decode debug opcode bytes to the contract layout', () => {
      const instructions = create()
        .withDebug()
        .decode(new SwapVmProgram('0x010003000400'))
        .getInstructions()

      expect(instructions).toHaveLength(3)
      expect(instructions[0].opcode).toBe(debug.printSwapQuery)
      expect(instructions[1].opcode).toBe(debug.printFreeMemoryPointer)
      expect(instructions[2].opcode).toBe(debug.printGasLeft)
    })

    it('should allow mixing debug and regular instructions', () => {
      const builder = create()
        .withDebug()
        .jump({ nextPC: 10n })
        .debugPrintSwapRegisters()
        .xycSwapXD()
        .debugPrintContext()

      expect(builder.getInstructions()).toHaveLength(4)
      expect(builder.build().toString()).toBe(mixedProgram)
    })
  })
})
