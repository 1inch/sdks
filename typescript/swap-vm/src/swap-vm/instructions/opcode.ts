import {Instruction} from './instruction'
import {IArgsCoder, IArgsData, IInstruction, IOpcode} from './types'

export class Opcode<T extends IArgsData> implements IOpcode<T> {
    constructor(
        public id: symbol,
        public readonly coder: IArgsCoder<T>
    ) {}

    argsCoder(): IArgsCoder<T> {
        return this.coder
    }

    createIx(args: T): IInstruction<T> {
        return new Instruction(this, args)
    }
}
