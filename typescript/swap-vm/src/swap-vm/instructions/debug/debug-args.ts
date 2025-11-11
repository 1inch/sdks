import { HexString } from '@1inch/sdk-core'
import { IArgsData } from '../types'

/**
 * Base class for all debug instruction arguments
 * Debug instructions don't have parameters, they just print/log state
 */
export abstract class DebugArgs implements IArgsData {
  static decode(_data: HexString): DebugArgs {
    throw new Error('Must be implemented by subclass')
  }

  toJSON(): null {
    return null
  }
}
