// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { DutchAuctionArgs } from './dutch-auction-args'
import { Opcode } from '../opcode'

/**
 * Dutch auction with time-based decay on amountIn
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/DutchAuction.sol#L75
 **/
export const dutchAuctionBalanceIn1D = new Opcode(
  Symbol('DutchAuction.dutchAuctionBalanceIn1D'),
  DutchAuctionArgs.CODER,
)

/**
 * Dutch auction with time-based decay on amountOut
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/DutchAuction.sol#L85
 **/
export const dutchAuctionBalanceOut1D = new Opcode(
  Symbol('DutchAuction.dutchAuctionBalanceOut1D'),
  DutchAuctionArgs.CODER,
)
