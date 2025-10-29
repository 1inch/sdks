import {HexString} from '@1inch/sdk-shared'
import {ProgramBuilder} from './program-builder'
import {SwapVmProgram} from './swap-vm-program'
import {
    allInstructions,
    setBalancesXD,
    balancesXD,
    BalancesArgs,
    IInstruction
} from '../instructions'

export class RegularProgramBuilder extends ProgramBuilder {
    constructor() {
        super([...allInstructions])
    }

    static decode(program: SwapVmProgram): RegularProgramBuilder {
        return new RegularProgramBuilder().decode(program)
    }

    public setBalancesXD(data: BalancesArgs): this {
        super.add(setBalancesXD, data)

        return this
    }

    public balancesXD(data: BalancesArgs): this {
        super.add(balancesXD, data)

        return this
    }

    toJSON(): Array<{
        opcode: string
        data: ReturnType<IInstruction['toJSON']>
    }> {
        return super.toJSON()
    }

    protected decodeInstruction(
        opcodeId: number,
        argsHex: string
    ): IInstruction {
        switch (opcodeId) {
            case 17: // SET_BALANCES_XD
            case 18: // BALANCES_XD
                return BalancesArgs.decode(new HexString(argsHex))

            default:
                throw new Error(`Unknown Regular opcode: ${opcodeId}`)
        }
    }
}
