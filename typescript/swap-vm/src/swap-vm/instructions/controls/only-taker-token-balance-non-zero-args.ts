import {Address, HexString} from '@1inch/sdk-shared'
import {OnlyTakerTokenBalanceNonZeroArgsCoder} from './only-taker-token-balance-non-zero-args-coder'
import {IArgsData} from '../types'

/**
 * Arguments for checking if taker holds any amount of a token
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Controls.sol#L10
 **/
export class OnlyTakerTokenBalanceNonZeroArgs implements IArgsData {
    public static readonly CODER = new OnlyTakerTokenBalanceNonZeroArgsCoder()

    constructor(public readonly token: Address) {}

    /**
     * Decodes hex data into OnlyTakerTokenBalanceNonZeroArgs instance
     **/
    static decode(data: HexString): OnlyTakerTokenBalanceNonZeroArgs {
        return OnlyTakerTokenBalanceNonZeroArgs.CODER.decode(data)
    }

    toJSON(): Record<string, unknown> {
        return {
            token: this.token.toString()
        }
    }
}
