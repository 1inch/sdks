import {HexString} from '@1inch/sdk-shared'
import {UINT_16_MAX} from '@1inch/byte-utils'
import assert from 'node:assert'
import {DecayXDArgsCoder} from './decay-xd-args-coder'
import {IArgsData} from '../types'

/**
 * Arguments for decayXD instruction with decay period
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Decay.sol#L79
 **/
export class DecayXDArgs implements IArgsData {
    public static readonly CODER = new DecayXDArgsCoder()

    constructor(public readonly decayPeriod: bigint) {
        assert(
            decayPeriod >= 0n && decayPeriod <= UINT_16_MAX,
            `Invalid decayPeriod value: ${decayPeriod}. Must be a valid uint16`
        )
    }

    /**
     * Decodes hex data into DecayXDArgs instance
     **/
    static decode(data: HexString): DecayXDArgs {
        return DecayXDArgs.CODER.decode(data)
    }

    toJSON(): Record<string, unknown> {
        return {
            decayPeriod: this.decayPeriod.toString()
        }
    }
}
