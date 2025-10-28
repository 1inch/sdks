import {HexString} from '@1inch/sdk-shared'
import {IArgsCoder, IInstruction} from '../types'

export class BalancesArgsCoder implements IArgsCoder<BalancesArgs> {
    decode(data: HexString): BalancesArgs {
        const iter = BytesIter.BigInt(data.toString())

        // ... decode
    }

    encode(data: BalancesArgs): HexString {
        //
        /// ...encode
    }
}
export class BalancesArgs implements IInstruction {
    static coder = new BalancesArgsCoder()

    constructor(
        public readonly tokenBalances: {value: bigint; token: AddressHalf}
    ) {}

    toJSON(): Record<string | number, unknown> {
        throw new Error('Method not implemented.')
    }

    coder(): IArgsCoder<IInstruction> {
        return BalancesArgs.coder
    }
}
