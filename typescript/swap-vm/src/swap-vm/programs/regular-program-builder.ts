import {ProgramBuilder} from './program-builder'
import {SwapVmProgram} from './swap-vm-program'
import {
    allInstructions,
    BalancesArgs,
    BalancesXDOpcode,
    SetBalancesXDOpcode
} from '../instructions'

export class RegularProgramBuilder extends ProgramBuilder {
    constructor() {
        super([...allInstructions])
    }

    static decode(program: SwapVmProgram): RegularProgramBuilder {
        return new RegularProgramBuilder().decode(program)
    }

    public setBalancesXD(data: BalancesArgs): this {
        super.add(new SetBalancesXDOpcode().createIx(data))

        return this
    }

    public balancesXD(data: BalancesArgs): this {
        super.add(new BalancesXDOpcode().createIx(data))

        return this
    }
}
