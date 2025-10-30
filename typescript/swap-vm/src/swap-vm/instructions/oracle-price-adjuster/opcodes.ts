import {OraclePriceAdjusterArgs} from './oracle-price-adjuster-args'
import {Opcode} from '../opcode'

/**
 * Adjusts swap prices based on Chainlink oracle feeds
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/OraclePriceAdjuster.sol#L84
 **/
export const oraclePriceAdjuster1D = new Opcode(
    Symbol('OraclePriceAdjuster.oraclePriceAdjuster1D'),
    OraclePriceAdjusterArgs.CODER
)
