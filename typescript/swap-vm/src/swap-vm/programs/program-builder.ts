import {BytesBuilder, BytesIter, trim0x, add0x} from '@1inch/byte-utils'
import {HexString} from '@1inch/sdk-shared'
import {SwapVmProgram} from './swap-vm-program'
import {IArgsData, IInstruction, IOpcode} from '../instructions'
import {EmptyOpcode} from '../instructions/empty'

export abstract class ProgramBuilder {
    protected program: IInstruction<IArgsData>[] = []

    protected constructor(public readonly ixsSet: IOpcode[]) {}

    public decode(program: SwapVmProgram): this {
        const iter = BytesIter.HexString(program.toString())

        while (!iter.isEmpty()) {
            const opcodeIdx = Number(iter.nextByte())
            const argsLength = Number(iter.nextByte())
            const argsHex = argsLength ? iter.nextBytes(argsLength) : ''

            if (opcodeIdx === 0) {
                throw new Error('Invalid opcode: 0 (NOT_INSTRUCTION)')
            }

            const opcode = this.ixsSet[opcodeIdx]

            if (!opcode) {
                throw new Error(`Opcode at index ${opcodeIdx} is missing`)
            }

            this.program.push(
                opcode.createIx(
                    opcode.argsCoder().decode(new HexString(argsHex))
                )
            )
        }

        return this
    }

    public build(): SwapVmProgram {
        const builder = new BytesBuilder()

        for (const ix of this.program) {
            const {args, opcode} = ix
            const opcodeIdx = this.ixsSet.findIndex((o) => o.id === opcode.id)
            const coder = opcode.argsCoder()
            const encoded = coder.encode(args)

            const encodedBytes = trim0x(encoded.toString())

            builder
                .addByte(BigInt(opcodeIdx))
                .addByte(BigInt(encodedBytes.length / 2))

            if (encodedBytes.length) {
                builder.addBytes(add0x(encodedBytes))
            }
        }

        return new SwapVmProgram(builder.asHex())
    }

    public getInstructions(): Array<IInstruction> {
        return this.program
    }

    protected add(ix: IInstruction): this {
        const opcodeId = this.ixsSet.findIndex((o) => o.id === ix.opcode.id)

        if (opcodeId === -1) {
            const opcodes = this.ixsSet
                .map((i) => String(i.id))
                .filter((s) => s !== EmptyOpcode.OPCODE.toString())
                .join(', ')

            throw new Error(
                `Invalid opcode ${String(ix.opcode.id)}: Supported opcodes: ${opcodes}`
            )
        }

        this.program.push(ix)

        return this
    }
}
