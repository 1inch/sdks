import {HexString} from '@1inch/sdk-shared'
import {UINT_32_MAX} from '@1inch/byte-utils'
import assert from 'node:assert'
import {FlatFeeArgsCoder} from './flat-fee-args-coder'
import {IArgsData} from '../types'

const BPS = 1e9 // 1e9 = 100%

/**
 * Arguments for flat fee instructions (flatFeeXD, flatFeeAmountInXD, flatFeeAmountOutXD, progressiveFeeXD)
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Fee.sol#L66
 **/
export class FlatFeeArgs implements IArgsData {
    public static readonly CODER = new FlatFeeArgsCoder()

    constructor(public readonly feeBps: bigint) {
        assert(
            feeBps >= 0n && feeBps <= UINT_32_MAX,
            `Invalid feeBps: ${feeBps}. Must be a valid uint32`
        )
        assert(
            feeBps <= BigInt(BPS),
            `Fee out of range: ${feeBps}. Must be <= ${BPS}`
        )
    }

    /**
     * Decodes hex data into FlatFeeArgs instance
     **/
    static decode(data: HexString): FlatFeeArgs {
        return FlatFeeArgs.CODER.decode(data)
    }

    toJSON(): Record<string, unknown> {
        return {
            feeBps: this.feeBps.toString()
        }
    }
}
