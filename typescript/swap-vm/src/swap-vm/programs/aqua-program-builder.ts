import {ProgramBuilder} from './program-builder'
import {SwapVmProgram} from './swap-vm-program'
import {aquaInstructions, IOpcode} from '../instructions'

export class AquaProgramBuilder extends ProgramBuilder {
    constructor() {
        super([...aquaInstructions])
    }

    static decode(program: SwapVmProgram): AquaProgramBuilder {
        return new AquaProgramBuilder().decode(program)
    }

    protected decodeInstruction(
        opcodeId: number,
        argsHex: string
    ): IOpcode {
        switch (opcodeId) {
            default:
                throw new Error(`Unknown Aqua opcode: ${opcodeId}`)
        }
    }
}
