import {ProgramBuilder} from './program-builder'
import {SwapVmProgram} from './swap-vm-program'
import {allInstructions, balances} from '../instructions'

export class RegularProgramBuilder extends ProgramBuilder {
    constructor() {
        super([...allInstructions])
    }

    static decode(program: SwapVmProgram): RegularProgramBuilder {
        return new RegularProgramBuilder().decode(program)
    }

    public setBalancesXD(data: balances.BalancesArgs): this {
        super.add(balances.SET_BALANCES_XD_OPCODE.createIx(data))

        return this
    }

    public balancesXD(data: balances.BalancesArgs): this {
        super.add(balances.BALANCES_XD_OPCODE.createIx(data))

        return this
    }
}
