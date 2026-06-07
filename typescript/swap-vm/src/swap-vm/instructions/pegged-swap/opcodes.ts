// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { PeggedSwapArgs } from './pegged-swap-args'
import { Opcode } from '../opcode'

/**
 * PeggedSwap - Square-root linear swap curve for pegged assets
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/PeggedSwap.sol
 **/
export const peggedSwapGrowPriceRange2D: Opcode<PeggedSwapArgs> = new Opcode(
  Symbol('PeggedSwap.peggedSwapGrowPriceRange2D'),
  PeggedSwapArgs.CODER,
)
