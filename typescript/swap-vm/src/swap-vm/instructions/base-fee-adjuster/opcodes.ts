import {BaseFeeAdjusterArgs} from './base-fee-adjuster-args'
import {Opcode} from '../opcode'

/**
 * Adjusts swap prices based on network gas costs
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/BaseFeeAdjuster.sol#L75
 **/
export const baseFeeAdjuster1D = new Opcode(
    Symbol('BaseFeeAdjuster.baseFeeAdjuster1D'),
    BaseFeeAdjusterArgs.CODER
)
