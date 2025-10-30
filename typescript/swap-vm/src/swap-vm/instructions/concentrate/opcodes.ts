import {ConcentrateGrowLiquidityXDArgs} from './concentrate-grow-liquidity-xd-args'
import {ConcentrateGrowLiquidity2DArgs} from './concentrate-grow-liquidity-2d-args'
import {Opcode} from '../opcode'

/**
 * Concentrates liquidity within price bounds for multiple tokens
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Concentrate.sol#L101
 **/
export const concentrateGrowLiquidityXD = new Opcode(
    Symbol('Concentrate.concentrateGrowLiquidityXD'),
    ConcentrateGrowLiquidityXDArgs.CODER
)

/**
 * Concentrates liquidity within price bounds for two tokens
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Concentrate.sol#L153
 **/
export const concentrateGrowLiquidity2D = new Opcode(
    Symbol('Concentrate.concentrateGrowLiquidity2D'),
    ConcentrateGrowLiquidity2DArgs.CODER
)
