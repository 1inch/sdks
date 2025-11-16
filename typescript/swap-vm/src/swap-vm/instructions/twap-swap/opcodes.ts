// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { TWAPSwapArgs } from './twap-swap-args'
import { Opcode } from '../opcode'

/**
 * TWAP trading with exponential dutch auction and illiquidity handling
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/TWAPSwap.sol#L104
 **/
export const twap = new Opcode(Symbol('TWAPSwap.twap'), TWAPSwapArgs.CODER)
