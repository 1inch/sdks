import {BalancesArgs} from './balances-args'
import {Opcode} from '../opcode'

export const SET_BALANCES_XD_OPCODE = new Opcode(
    Symbol('Balances.setBalancesXD'),
    BalancesArgs.CODER
)

export const BALANCES_XD_OPCODE = new Opcode(
    Symbol('Balances.balancesXD'),
    BalancesArgs.CODER
)
