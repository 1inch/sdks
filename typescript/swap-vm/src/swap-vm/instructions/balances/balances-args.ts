import {HexString} from '@1inch/sdk-shared'
import {TokenBalance} from './types'
import {BalancesArgsCoder} from './balances-args-coder'
import {IArgsData} from '../types'

export class BalancesArgs implements IArgsData {
    public static readonly CODER = new BalancesArgsCoder()

    constructor(public readonly tokenBalances: TokenBalance[]) {}

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
