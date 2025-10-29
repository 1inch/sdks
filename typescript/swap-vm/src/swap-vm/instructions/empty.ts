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

export class EmptyOpcode extends Opcode<EmptyArgs> {
    static INSTANCE = new EmptyOpcode()

    static OPCODE = Symbol('empty')

    id = EmptyOpcode.OPCODE

    constructor() {
        super(EmptyArgs.CODER)
    }
}

export const opcode = new EmptyOpcode()
