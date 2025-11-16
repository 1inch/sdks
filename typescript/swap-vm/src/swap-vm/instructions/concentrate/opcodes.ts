// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { ConcentrateGrowLiquidityXDArgs } from './concentrate-grow-liquidity-xd-args'
import { ConcentrateGrowLiquidity2DArgs } from './concentrate-grow-liquidity-2d-args'
import { Opcode } from '../opcode'

/**
 * Concentrates liquidity within price bounds for multiple tokens
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/XYCConcentrate.sol#L139
 **/
export const concentrateGrowLiquidityXD = new Opcode(
  Symbol('XYCConcentrate.concentrateGrowLiquidityXD'),
  ConcentrateGrowLiquidityXDArgs.CODER,
)

/**
 * Concentrates liquidity within price bounds for two tokens
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/XYCConcentrate.sol#L172
 **/
export const concentrateGrowLiquidity2D = new Opcode(
  Symbol('XYCConcentrate.concentrateGrowLiquidity2D'),
  ConcentrateGrowLiquidity2DArgs.CODER,
)
