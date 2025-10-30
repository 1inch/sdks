import {Address, HexString} from '@1inch/sdk-shared'
import assert from 'node:assert'
import {OnlyTakerTokenSupplyShareGteArgsCoder} from './only-taker-token-supply-share-gte-args-coder'
import {IArgsData} from '../types'

const UINT_64_MAX = 0xffffffffffffffffn

/**
 * Arguments for checking if taker holds at least specified share of token's total supply
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Controls.sol#L10
 **/
export class OnlyTakerTokenSupplyShareGteArgs implements IArgsData {
    public static readonly CODER = new OnlyTakerTokenSupplyShareGteArgsCoder()

    constructor(
        public readonly token: Address,
        public readonly minShareE18: bigint
    ) {
        assert(
            minShareE18 >= 0n && minShareE18 <= UINT_64_MAX,
            `Invalid minShareE18 value: ${minShareE18}. Must be a valid uint64`
        )
    }

    /**
     * Decodes hex data into OnlyTakerTokenSupplyShareGteArgs instance
     **/
    static decode(data: HexString): OnlyTakerTokenSupplyShareGteArgs {
        return OnlyTakerTokenSupplyShareGteArgs.CODER.decode(data)
    }

    toJSON(): Record<string, unknown> {
        return {
            token: this.token.toString(),
            minShareE18: this.minShareE18.toString()
        }
    }
}
