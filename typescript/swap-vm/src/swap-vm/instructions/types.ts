import {HexString} from '@1inch/sdk-shared'

export interface IArgsCoder<T> {
    decode(data: HexString): T
    encode(data: T): HexString
}

export interface IInstruction {
    coder(): IArgsCoder<IInstruction>
    toJSON(): Record<string | number, unknown>
}
