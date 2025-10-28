import {Address} from '@1inch/sdk-shared'
import {SwapVmProgram} from './swap-vm-program'
import {ProgramBuilder} from './program-builder'
import {aquaInstruction, BalancesArgs, setBalancesXD} from '../instructions'

export class AquaProgramBuilder extends ProgramBuilder {
    constructor() {
        super([...aquaInstruction])
    }

    static decode(program: SwapVmProgram): AquaProgramBuilder {}

    public setBalancesXD(data: BalancesArgs): this {
        super.add(setBalancesXD, data)

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

export const AMM_APSPDF_STRATEGY = new AquaProgramBuilder()
    .setBalancesXD(new BalancesArgs([{token: '', value: 0}]))
    .build()

class AmmStrategy {
    constructor(token: Address, amount: bigint) {}

    public build(): SwapVmProgram {
        new AquaProgramBuilder()
            .setBalancesXD(
                new BalancesArgs([{token: this.token, value: this.value}])
            )
            .build()
    }
}
