import {BalancesArgs} from './balances-args'
import {Opcode} from '../opcode'

/**
 * Sets initial token balances for the swap program
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Balances.sol#L59
 **/
export const SET_BALANCES_XD_OPCODE = new Opcode(
    Symbol('Balances.setBalancesXD'),
    BalancesArgs.CODER
)

/**
 * Reads token balances from program data or contract storage
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Balances.sol#L89
 **/
export const BALANCES_XD_OPCODE = new Opcode(
    Symbol('Balances.balancesXD'),
    BalancesArgs.CODER
)
