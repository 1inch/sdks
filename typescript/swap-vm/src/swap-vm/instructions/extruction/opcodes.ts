import {ExtructionArgs} from './extruction-args'
import {Opcode} from '../opcode'

/**
 * Calls external contract to perform custom logic, potentially modifying swap state
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Extruction.sol#L33
 **/
export const extruction = new Opcode(
    Symbol('Extruction.extruction'),
    ExtructionArgs.CODER
)
