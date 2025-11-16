// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { XycSwapXDArgs } from './xyc-swap-xd-args'
import { Opcode } from '../opcode'

/**
 * Basic swap using constant product formula (x*y=k)
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/XYCSwap.sol#L15
 **/
export const xycSwapXD = new Opcode(Symbol('XYCSwap.xycSwapXD'), XycSwapXDArgs.CODER)
