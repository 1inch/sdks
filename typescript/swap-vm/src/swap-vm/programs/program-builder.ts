import {BytesBuilder, BytesIter, trim0x, add0x} from '@1inch/byte-utils'
import {SwapVmProgram} from './swap-vm-program'
import {IInstruction} from '../instructions'
import {emptyInstruction} from '../instructions/empty'

export abstract class ProgramBuilder {
    protected program: Array<{
        opcodeId: number
        data: IInstruction
    }> = []

    protected constructor(public readonly opcodes: readonly symbol[]) {}

    public decode(program: SwapVmProgram): this {
        const iter = BytesIter.HexString(program.toString())

        while (!iter.isEmpty()) {
            const opcodeId = Number(iter.nextByte())
            const argsLength = Number(iter.nextByte())
            const argsHex = argsLength ? iter.nextBytes(argsLength) : ''

            if (opcodeId === 0) {
                throw new Error('Invalid opcode: 0 (NOT_INSTRUCTION)')
            }

            const instruction = this.decodeInstruction(opcodeId, add0x(argsHex))

            this.program.push({opcodeId, data: instruction})
        }

        return this
    }

    public build(): SwapVmProgram {
        const builder = new BytesBuilder()

        for (const {opcodeId, data} of this.program) {
            const coder = data.coder()
            const encoded = coder.encode(data)

            const encodedBytes = trim0x(encoded.toString())

            builder
                .addByte(BigInt(opcodeId))
                .addByte(BigInt(encodedBytes.length / 2))

            if (encodedBytes.length) {
                builder.addBytes(add0x(encodedBytes))
            }
        }

        return new SwapVmProgram(builder.asHex())
    }

    public toJSON(): Array<{
        opcode: string
        data: ReturnType<IInstruction['toJSON']>
    }> {
        return this.program.map(({opcodeId, data}) => ({
            opcode: String(this.opcodes[opcodeId]),
            data: data.toJSON()
        }))
    }

    protected add(opcode: symbol, data: IInstruction): this {
        const opcodeId = this.opcodes.findIndex((o) => o === opcode)

        if (opcodeId === -1) {
            throw new Error(
                `Invalid opcode ${String(opcode)}: Supported opcodes: ${this.opcodes
                    .map((o) => String(o))
                    .filter((s) => s !== String(emptyInstruction))
                    .join(', ')}`
            )
        }

        this.program.push({opcodeId, data})

        return this
    }

    protected abstract decodeInstruction(
        opcodeId: number,
        argsHex: string
    ): IInstruction
}
