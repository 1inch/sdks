import type { IArgsData } from '../types'

/**
 * Base class for all debug instruction arguments
 * Debug instructions don't have parameters, they just print/log state
 */
export abstract class DebugArgs implements IArgsData {
  toJSON(): null {
    return null
  }
}
