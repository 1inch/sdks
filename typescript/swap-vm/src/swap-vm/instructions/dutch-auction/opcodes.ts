import {DutchAuctionArgs} from './dutch-auction-args'
import {Opcode} from '../opcode'

/**
 * Dutch auction with time-based decay on amountIn
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/DutchAuction.sol#L75
 **/
export const dutchAuctionAmountIn1D = new Opcode(
    Symbol('DutchAuction.dutchAuctionAmountIn1D'),
    DutchAuctionArgs.CODER
)

/**
 * Dutch auction with time-based decay on amountOut
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/DutchAuction.sol#L85
 **/
export const dutchAuctionAmountOut1D = new Opcode(
    Symbol('DutchAuction.dutchAuctionAmountOut1D'),
    DutchAuctionArgs.CODER
)
