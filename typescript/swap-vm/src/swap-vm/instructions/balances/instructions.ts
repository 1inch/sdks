import {BalancesArgs} from './balances-args'
import {Opcode} from '../opcode'

export class SetBalancesXDOpcode extends Opcode<BalancesArgs> {
    static ID = Symbol('Balances.setBalancesXD')

    id = SetBalancesXDOpcode.ID

    constructor() {
        super(BalancesArgs.CODER)
    }
}

/**
 * todo docs
 */
export class BalancesXDOpcode extends Opcode<BalancesArgs> {
    static ID = Symbol('Balances.balancesXD')

    id = BalancesXDOpcode.ID

    constructor() {
        super(BalancesArgs.CODER)
    }
}
