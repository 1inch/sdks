import {HexString} from '@1inch/sdk-shared'
import {UINT_64_MAX} from '@1inch/byte-utils'
import assert from 'node:assert'
import {SaltArgsCoder} from './salt-args-coder'
import {IArgsData} from '../types'

/**
 * Arguments for salt instruction used to add uniqueness to order hashes
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Controls.sol#L48
 **/
export class SaltArgs implements IArgsData {
    public static readonly CODER = new SaltArgsCoder()

    constructor(public readonly salt: bigint) {
        assert(
            salt >= 0n && salt <= UINT_64_MAX,
            `Invalid salt value: ${salt}. Must be a valid uint64`
        )
    }

    /**
     * Decodes hex data into SaltArgs instance
     **/
    static decode(data: HexString): SaltArgs {
        return SaltArgs.CODER.decode(data)
    }

    toJSON(): Record<string, unknown> {
        return {
            salt: this.salt.toString()
        }
    }
}
