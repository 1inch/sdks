import { HexString } from '@1inch/sdk-core'
import type { IArgsCoder, IArgsData } from './types'
import { Opcode } from './opcode'

class EmptyCoder implements IArgsCoder<EmptyArgs> {
  encode(_: EmptyArgs): HexString {
    return HexString.EMPTY
  }

  decode(_: HexString): EmptyArgs {
    return new EmptyArgs()
  }
}

class EmptyArgs implements IArgsData {
  public static readonly CODER: EmptyCoder = new EmptyCoder()

  toJSON(): null {
    return null
  }
}

export const EMPTY_OPCODE: Opcode<EmptyArgs> = new Opcode(Symbol('empty'), EmptyArgs.CODER)
