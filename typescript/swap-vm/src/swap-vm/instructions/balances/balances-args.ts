import {HexString} from '@1inch/sdk-shared'
import {TokenBalance} from './types'
import {BalancesArgsCoder} from './balances-args-coder'
import {IArgsData} from '../types'

/**
 * Arguments for setBalances and balances instructions containing token-amount pairs
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Balances.sol#L10
 **/
export class BalancesArgs implements IArgsData {
    public static readonly CODER = new BalancesArgsCoder()

    constructor(public readonly tokenBalances: TokenBalance[]) {}

    /**
     *  Decodes hex data into BalancesArgs instance
     **/
    static decode(data: HexString): BalancesArgs {
        return BalancesArgs.CODER.decode(data)
    }

    toJSON(): Record<string, unknown> {
        return {
            tokenBalances: this.tokenBalances.map(({tokenHalf, value}) => ({
                token: tokenHalf.toString(),
                value: value.toString()
            }))
        }
    }
}
