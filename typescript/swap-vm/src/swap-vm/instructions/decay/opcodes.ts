import {DecayXDArgs} from './decay-xd-args'
import {Opcode} from '../opcode'

/**
 * Applies time-based decay to balance adjustments
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Decay.sol#L79
 **/
export const decayXD = new Opcode(Symbol('Decay.decayXD'), DecayXDArgs.CODER)
