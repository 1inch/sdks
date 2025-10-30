import {StableSwap2DArgs} from './stable-swap-2d-args'
import {Opcode} from '../opcode'

/**
 * Stablecoin optimized swap using StableSwap algorithm (Curve-style)
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/StableSwap.sol#L45
 **/
export const stableSwap2D = new Opcode(
    Symbol('StableSwap.stableSwap2D'),
    StableSwap2DArgs.CODER
)
