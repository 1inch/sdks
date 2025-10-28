import {SwapVmProgram} from './swap-vm-program'
import {
    allInstructions,
    aquaInstruction,
    BalancesArgs,
    setBalancesXD
} from '../instructions'
import {IInstruction} from '../instructions/types'

export class ProgramBuilder {
    static AQUA = new ProgramBuilder([...aquaInstruction])

    static ALL = new ProgramBuilder([...allInstructions])

    private program: {opcodeId: number; data: IInstruction}[] = []

    constructor(public readonly opcodes: symbol[]) {}

    public build(): SwapVmProgram {}

    static decode(program: SwapVmProgram): ProgramBuilder

    public toJSON(): {
        opcode: string
        data: ReturnType<IInstruction['toJSON']>
    }[] {
      
    }

    public add(opcode: symbol, data: IInstruction): this {
        const opcodeId = this.opcodes.findIndex((o) => o === opcode)

        if (opcodeId == -1) {
            throw new Error(
                `Invalid opcode ${String(opcode)}: Supported opcodes: ${this.opcodes.map((o) => String(o))}`
            )
        }

        this.program.push({opcodeId, data})

        return this
    }
}

const buidler = ProgramBuilder.AQUA

buidler
    .add(setBalancesXD, new BalancesArgs([{token: '', value: 0}]))
    .add(setBalancesXD, new BalancesArgs([{token: '', value: 0}]))
    .add(setBalancesXD, new BalancesArgs([{token: '', value: 0}]))
    .add(setBalancesXD, new BalancesArgs([{token: '', value: 0}]))

const program = buidler.build()
