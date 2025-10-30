import {Address, HexString} from '@1inch/sdk-shared'
import assert from 'node:assert'
import {OnlyTakerTokenBalanceGteArgsCoder} from './only-taker-token-balance-gte-args-coder'
import {IArgsData} from '../types'

/**
 * Arguments for checking if taker holds at least specified amount of token
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Controls.sol#L10
 **/
export class OnlyTakerTokenBalanceGteArgs implements IArgsData {
    public static readonly CODER = new OnlyTakerTokenBalanceGteArgsCoder()

    constructor(
        public readonly token: Address,
        public readonly minAmount: bigint
    ) {
        assert(minAmount >= 0n, 'minAmount must be non-negative')
    }

    /**
     * Decodes hex data into OnlyTakerTokenBalanceGteArgs instance
     **/
    static decode(data: HexString): OnlyTakerTokenBalanceGteArgs {
        return OnlyTakerTokenBalanceGteArgs.CODER.decode(data)
    }

    toJSON(): Record<string, unknown> {
        return {
            token: this.token.toString(),
            minAmount: this.minAmount.toString()
        }
    }
}
