import {BytesBuilder, BytesIter} from '@1inch/byte-utils'
import {Address, HexString} from '@1inch/sdk-shared'
import {ProtocolFeeArgs} from './protocol-fee-args'
import {IArgsCoder} from '../types'

export class ProtocolFeeArgsCoder implements IArgsCoder<ProtocolFeeArgs> {
    encode(args: ProtocolFeeArgs): HexString {
        const builder = new BytesBuilder()
        builder.addUint32(args.feeBps)
        builder.addAddress(args.to.toString())

        return new HexString(builder.asHex())
    }

    decode(data: HexString): ProtocolFeeArgs {
        const iter = BytesIter.HexString(data.toString())
        const feeBps = iter.nextUint32()
        const to = new Address(iter.nextAddress())

        return new ProtocolFeeArgs(BigInt(feeBps), to)
    }
}
