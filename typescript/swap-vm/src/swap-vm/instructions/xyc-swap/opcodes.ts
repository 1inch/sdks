import {XycSwapXDArgs} from './xyc-swap-xd-args'
import {Opcode} from '../opcode'

/**
 * Basic swap using constant product formula (x*y=k)
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/XYCSwap.sol#L15
 **/
export const xycSwapXD = new Opcode(
    Symbol('XYCSwap.xycSwapXD'),
    XycSwapXDArgs.CODER
)
