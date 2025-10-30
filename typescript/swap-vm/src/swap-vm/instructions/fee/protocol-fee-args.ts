import {Address, HexString} from '@1inch/sdk-shared'
import {UINT_32_MAX} from '@1inch/byte-utils'
import assert from 'node:assert'
import {ProtocolFeeArgsCoder} from './protocol-fee-args-coder'
import {IArgsData} from '../types'

const BPS = 1e9 // 1e9 = 100%

/**
 * Arguments for protocol fee instructions (protocolFeeAmountOutXD, aquaProtocolFeeAmountOutXD)
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Fee.sol#L102
 **/
export class ProtocolFeeArgs implements IArgsData {
    public static readonly CODER = new ProtocolFeeArgsCoder()

    /**
     * feeBps - fee in bps, 1e9 = 100% (uint32)
     * to - address to send pulled tokens to (20 bytes)
     **/
    constructor(
        public readonly feeBps: bigint,
        public readonly to: Address
    ) {
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
     * Decodes hex data into ProtocolFeeArgs instance
     **/
    static decode(data: HexString): ProtocolFeeArgs {
        return ProtocolFeeArgs.CODER.decode(data)
    }

    toJSON(): Record<string, unknown> {
        return {
            feeBps: this.feeBps.toString(),
            to: this.to.toString()
        }
    }
}
