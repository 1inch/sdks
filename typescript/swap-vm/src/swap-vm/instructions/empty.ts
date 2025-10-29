import {HexString} from '@1inch/sdk-shared'
import {IArgsCoder, IArgsData} from './types'
import {Opcode} from './opcode'

class EmptyCoder implements IArgsCoder<EmptyArgs> {
    encode(_: EmptyArgs): HexString {
        return HexString.EMPTY
    }

    decode(_: HexString): EmptyArgs {
        return new EmptyArgs()
    }
}

class EmptyArgs implements IArgsData {
    public static readonly CODER = new EmptyCoder()

    toJSON(): null {
        return null
    }
}

export const EMPTY_OPCODE = new Opcode(Symbol('empty'), EmptyArgs.CODER)
