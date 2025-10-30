import {TWAPSwapArgs} from './twap-swap-args'
import {Opcode} from '../opcode'

/**
 * TWAP trading with exponential dutch auction and illiquidity handling
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/TWAPSwap.sol#L104
 **/
export const twap = new Opcode(Symbol('TWAPSwap.twap'), TWAPSwapArgs.CODER)
