import {ProgramBuilder} from './program-builder'
import {SwapVmProgram} from './swap-vm-program'
import {aquaInstructions, IInstruction} from '../instructions'

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
    ): IInstruction {
        switch (opcodeId) {
            default:
                throw new Error(`Unknown Aqua opcode: ${opcodeId}`)
        }
    }
}
