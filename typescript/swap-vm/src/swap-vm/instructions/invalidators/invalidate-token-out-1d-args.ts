import {AddressHalf, HexString} from '@1inch/sdk-shared'
import {InvalidateTokenOut1DArgsCoder} from './invalidate-token-out-1d-args-coder'
import {IArgsData} from '../types'

/**
 * Arguments for invalidateTokenOut1D instruction to invalidate by token output
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Invalidators.sol#L103
 **/
export class InvalidateTokenOut1DArgs implements IArgsData {
    public static readonly CODER = new InvalidateTokenOut1DArgsCoder()

    constructor(public readonly tokenOutHalf: AddressHalf) {}

    /**
     * Decodes hex data into InvalidateTokenOut1DArgs instance
     **/
    static decode(data: HexString): InvalidateTokenOut1DArgs {
        return InvalidateTokenOut1DArgs.CODER.decode(data)
    }

    toJSON(): Record<string, unknown> {
        return {
            tokenOut: this.tokenOutHalf.toString()
        }
    }
}
