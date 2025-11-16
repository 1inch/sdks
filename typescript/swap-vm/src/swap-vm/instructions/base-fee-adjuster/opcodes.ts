// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BaseFeeAdjusterArgs } from './base-fee-adjuster-args'
import { Opcode } from '../opcode'

/**
 * Adjusts swap prices based on network gas costs
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/BaseFeeAdjuster.sol#L75
 **/
export const baseFeeAdjuster1D = new Opcode(
  Symbol('BaseFeeAdjuster.baseFeeAdjuster1D'),
  BaseFeeAdjusterArgs.CODER,
)
