// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { StableSwap2DArgs } from './stable-swap-2d-args'
import { Opcode } from '../opcode'

/**
 * Stablecoin optimized swap using StableSwap algorithm (Curve-style)
 **/
export const stableSwap2D = new Opcode(Symbol('StableSwap.stableSwap2D'), StableSwap2DArgs.CODER)
