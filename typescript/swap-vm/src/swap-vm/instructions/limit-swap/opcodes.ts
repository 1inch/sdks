import {LimitSwapDirectionArgs} from './limit-swap-direction-args'
import {Opcode} from '../opcode'

/**
 * Limit order swap with proportional execution
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/LimitSwap.sol#L27
 **/
export const limitSwap1D = new Opcode(
    Symbol('LimitSwap.limitSwap1D'),
    LimitSwapDirectionArgs.CODER
)

/**
 * Limit order swap requiring full amount execution
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/LimitSwap.sol#L44
 **/
export const limitSwapOnlyFull1D = new Opcode(
    Symbol('LimitSwap.limitSwapOnlyFull1D'),
    LimitSwapDirectionArgs.CODER
)
