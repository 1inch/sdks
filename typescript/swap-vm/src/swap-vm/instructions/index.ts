import { OpcodeRegistry } from './opcode-registry'
export * from './types'
export { EMPTY_OPCODE } from './empty'
export { OpcodeRegistry, productionRegistry, debugRegistry } from './opcode-registry'

/**
 * Create a custom opcode registry with your preferred debug mode
 * @param debugMode - Whether to inject debug opcodes (true) or keep them as empty (false)
 * @example
 * ```typescript
 * // Production mode - no debug opcodes
 * const prodOpcodes = createOpcodeRegistry(false)
 *
 * // Debug mode - debug opcodes injected
 * const debugOpcodes = createOpcodeRegistry(true)
 * ```
 */
export function createOpcodeRegistry(debugMode: boolean): OpcodeRegistry {
  return new OpcodeRegistry(debugMode)
}
