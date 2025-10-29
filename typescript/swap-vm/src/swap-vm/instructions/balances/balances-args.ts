import {HexString} from '@1inch/sdk-shared'
import {TokenBalance} from './types'
import {BalancesArgsCoder} from './balances-args-coder'
import {IArgsCoder, IInstruction} from '../types'

export class BalancesArgs implements IInstruction {
    private static readonly CODER = new BalancesArgsCoder()

    constructor(public readonly tokenBalances: TokenBalance[]) {}

    static decode(data: HexString): BalancesArgs {
        return BalancesArgs.CODER.decode(data)
    }

    coder(): IArgsCoder<IInstruction> {
        return BalancesArgs.CODER
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
