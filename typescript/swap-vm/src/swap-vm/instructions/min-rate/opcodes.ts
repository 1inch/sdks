import {MinRateArgs} from './min-rate-args'
import {Opcode} from '../opcode'

/**
 * Enforces minimum exchange rate or reverts
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/MinRate.sol#L36
 **/
export const requireMinRate1D = new Opcode(
    Symbol('MinRate.requireMinRate1D'),
    MinRateArgs.CODER
)

/**
 * Adjusts swap amounts to meet minimum rate if needed
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/MinRate.sol#L50
 **/
export const adjustMinRate1D = new Opcode(
    Symbol('MinRate.adjustMinRate1D'),
    MinRateArgs.CODER
)
