// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { RegularProgramBuilder } from './regular-program-builder'
import { AquaProgramBuilder } from './aqua-program-builder'
import * as debug from '../instructions/debug/opcodes'

describe('Debug Program Functionality', () => {
  describe('RegularProgramBuilder', () => {
    it('should enable debug mode with withDebug()', () => {
      const builder = new RegularProgramBuilder()

      builder.withDebug()

      expect(builder['ixsSet'][0]).toBe(debug.printSwapRegisters)
      expect(builder['ixsSet'][1]).toBe(debug.printSwapQuery)
      expect(builder['ixsSet'][2]).toBe(debug.printContext)
      expect(builder['ixsSet'][3]).toBe(debug.printAmountForSwap)
      expect(builder['ixsSet'][4]).toBe(debug.printFreeMemoryPointer)
      expect(builder['ixsSet'][5]).toBe(debug.printGasLeft)
    })

    it('should allow chaining of debug methods after withDebug()', () => {
      const builder = new RegularProgramBuilder()

      const result = builder
        .withDebug()
        .debugPrintSwapRegisters()
        .debugPrintSwapQuery()
        .debugPrintContext()
        .debugPrintAmountForSwap()
        .debugPrintFreeMemoryPointer()
        .debugPrintGasLeft()

      expect(result).toBe(builder)

      const instructions = builder.getInstructions()
      expect(instructions.length).toBe(6)
    })

    it('should build program with debug instructions', () => {
      const builder = new RegularProgramBuilder()

      builder.withDebug().debugPrintSwapRegisters().debugPrintContext()

      const instructions = builder.getInstructions()

      expect(instructions.length).toBe(2)
      expect(instructions[0].opcode).toBe(debug.printSwapRegisters)
      expect(instructions[1].opcode).toBe(debug.printContext)
    })
  })

  describe('AquaProgramBuilder', () => {
    it('should enable debug mode with withDebug()', () => {
      const builder = new AquaProgramBuilder()

      builder.withDebug()

      expect(builder['ixsSet'][0]).toBe(debug.printSwapRegisters)
      expect(builder['ixsSet'][1]).toBe(debug.printSwapQuery)
      expect(builder['ixsSet'][2]).toBe(debug.printContext)
      expect(builder['ixsSet'][3]).toBe(debug.printAmountForSwap)
      expect(builder['ixsSet'][4]).toBe(debug.printFreeMemoryPointer)
      expect(builder['ixsSet'][5]).toBe(debug.printGasLeft)
    })

    it('should allow chaining of debug methods after withDebug()', () => {
      const builder = new AquaProgramBuilder()

      const result = builder
        .withDebug()
        .debugPrintSwapRegisters()
        .debugPrintSwapQuery()
        .debugPrintContext()
        .debugPrintAmountForSwap()
        .debugPrintFreeMemoryPointer()
        .debugPrintGasLeft()

      expect(result).toBe(builder)

      const instructions = builder.getInstructions()
      expect(instructions.length).toBe(6)
    })

    it('should build program with debug instructions', () => {
      const builder = new AquaProgramBuilder()

      builder.withDebug().debugPrintSwapRegisters().debugPrintContext()

      const instructions = builder.getInstructions()

      expect(instructions.length).toBe(2)
      expect(instructions[0].opcode).toBe(debug.printSwapRegisters)
      expect(instructions[1].opcode).toBe(debug.printContext)
    })

    it('should allow mixing debug and regular instructions', () => {
      const builder = new AquaProgramBuilder()

      builder
        .withDebug()
        .jump({ nextPC: 10n })
        .debugPrintSwapRegisters()
        .xycSwapXD()
        .debugPrintContext()

      const instructions = builder.getInstructions()

      expect(instructions.length).toBe(4)
    })
  })
})
