// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { OraclePriceAdjusterArgs } from './oracle-price-adjuster-args'
import { Opcode } from '../opcode'

/**
 * Adjusts swap prices based on Chainlink oracle feeds
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/OraclePriceAdjuster.sol#L84
 **/
export const oraclePriceAdjuster1D = new Opcode(
  Symbol('OraclePriceAdjuster.oraclePriceAdjuster1D'),
  OraclePriceAdjusterArgs.CODER,
)
