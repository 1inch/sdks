import {HexString} from '@1inch/sdk-shared'
import {IArgsCoder} from './types'
import {Opcode} from './opcode'

class EmptyCoder implements IArgsCoder<EmptyArgs> {
    encode(_: EmptyArgs): HexString {
        return HexString.EMPTY
    }

    decode(): EmptyArgs {
        return new EmptyArgs()
    }
}

class EmptyArgs {
    public static readonly CODER = new EmptyCoder()

    toJSON(): Record<string | number, unknown> {
        return {
            data: 'no args'
        }
    }
}

export const EMPTY_OPCODE = new Opcode(Symbol('empty'), EmptyArgs.CODER)
