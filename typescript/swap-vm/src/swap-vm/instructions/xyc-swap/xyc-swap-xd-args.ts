import {HexString} from '@1inch/sdk-shared'
import {XycSwapXDArgsCoder} from './xyc-swap-xd-args-coder'
import {IArgsData} from '../types'

/**
 * Arguments for xycSwapXD instruction (no arguments required)
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/XYCSwap.sol#L15
 **/
export class XycSwapXDArgs implements IArgsData {
    public static readonly CODER = new XycSwapXDArgsCoder()

    constructor() {}

    /**
     * Decodes hex data into XycSwapXDArgs instance
     **/
    static decode(data: HexString): XycSwapXDArgs {
        return XycSwapXDArgs.CODER.decode(data)
    }

    toJSON(): Record<string, unknown> {
        return {}
    }
}
