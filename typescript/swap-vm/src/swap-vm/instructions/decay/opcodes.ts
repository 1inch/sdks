import {DecayXDArgs} from './decay-xd-args'
import {Opcode} from '../opcode'

/**
 * Applies time-based decay to balance adjustments
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Decay.sol#L79
 **/
export const decayXD = new Opcode(Symbol('Decay.decayXD'), DecayXDArgs.CODER)
