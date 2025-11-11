import { describe, it, expect } from 'vitest'
import { OpcodeRegistry, productionRegistry, debugRegistry } from './opcode-registry'
import { EMPTY_OPCODE } from './empty'
import * as debug from './debug'

describe('OpcodeRegistry', () => {
  describe('Production Mode', () => {
    it('should have EMPTY_OPCODE in debug slots for production', () => {
      const registry = new OpcodeRegistry(false)
      const opcodes = registry.getAllInstructions()

      expect(opcodes[0]).toBe(EMPTY_OPCODE)
      expect(opcodes[1]).toBe(EMPTY_OPCODE)
      expect(opcodes[2]).toBe(EMPTY_OPCODE)
      expect(opcodes[3]).toBe(EMPTY_OPCODE)
      expect(opcodes[4]).toBe(EMPTY_OPCODE)
      expect(opcodes[5]).toBe(EMPTY_OPCODE)
      expect(opcodes[6]).toBe(EMPTY_OPCODE)
      expect(opcodes[7]).toBe(EMPTY_OPCODE)
      expect(opcodes[8]).toBe(EMPTY_OPCODE)
      expect(opcodes[9]).toBe(EMPTY_OPCODE)
    })

    it('should not be in debug mode', () => {
      const registry = new OpcodeRegistry(false)
      expect(registry.isDebugMode()).toBe(false)
    })
  })

  describe('Debug Mode', () => {
    it('should inject debug opcodes in slots 1-6', () => {
      const registry = new OpcodeRegistry(true)
      const opcodes = registry.getAllInstructions()

      expect(opcodes[0]).toBe(debug.printSwapRegisters)
      expect(opcodes[1]).toBe(debug.printSwapQuery)
      expect(opcodes[2]).toBe(debug.printContext)
      expect(opcodes[3]).toBe(debug.printAmountForSwap)
      expect(opcodes[4]).toBe(debug.printFreeMemoryPointer)
      expect(opcodes[5]).toBe(debug.printGasLeft)

      expect(opcodes[6]).toBe(EMPTY_OPCODE)
      expect(opcodes[7]).toBe(EMPTY_OPCODE)
      expect(opcodes[8]).toBe(EMPTY_OPCODE)
      expect(opcodes[9]).toBe(EMPTY_OPCODE)
    })

    it('should be in debug mode', () => {
      const registry = new OpcodeRegistry(true)
      expect(registry.isDebugMode()).toBe(true)
    })

    it('should inject debug opcodes in aqua instructions too', () => {
      const registry = new OpcodeRegistry(true)
      const aquaOpcodes = registry.getAquaInstructions()

      expect(aquaOpcodes[0]).toBe(debug.printSwapRegisters)
      expect(aquaOpcodes[1]).toBe(debug.printSwapQuery)
      expect(aquaOpcodes[2]).toBe(debug.printContext)
      expect(aquaOpcodes[3]).toBe(debug.printAmountForSwap)
      expect(aquaOpcodes[4]).toBe(debug.printFreeMemoryPointer)
      expect(aquaOpcodes[5]).toBe(debug.printGasLeft)
    })
  })

  describe('Default Instances', () => {
    it('productionRegistry should be in production mode', () => {
      expect(productionRegistry.isDebugMode()).toBe(false)
      const opcodes = productionRegistry.getAllInstructions()
      expect(opcodes[0]).toBe(EMPTY_OPCODE)
    })

    it('debugRegistry should be in debug mode', () => {
      expect(debugRegistry.isDebugMode()).toBe(true)
      const opcodes = debugRegistry.getAllInstructions()
      expect(opcodes[0]).toBe(debug.printSwapRegisters)
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain correct opcode positions after debug slots', () => {
      const prodRegistry = new OpcodeRegistry(false)
      const debugRegistryInst = new OpcodeRegistry(true)

      const prodOpcodes = prodRegistry.getAllInstructions()
      const debugOpcodes = debugRegistryInst.getAllInstructions()

      expect(prodOpcodes[10]).toBe(debugOpcodes[10]) // JUMP at slot 11
      expect(prodOpcodes[11]).toBe(debugOpcodes[11]) // JUMP_IF_EXACT_IN at slot 12
      expect(prodOpcodes[12]).toBe(debugOpcodes[12]) // JUMP_IF_EXACT_OUT at slot 13

      expect(prodOpcodes.length).toBe(43)
      expect(debugOpcodes.length).toBe(43)
    })
  })
})
