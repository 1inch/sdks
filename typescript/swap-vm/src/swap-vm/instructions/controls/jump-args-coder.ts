import {BytesBuilder, BytesIter, add0x} from '@1inch/byte-utils'
import {HexString} from '@1inch/sdk-shared'
import {JumpArgs} from './jump-args'
import {IArgsCoder} from '../types'

export class JumpArgsCoder implements IArgsCoder<JumpArgs> {
    encode(args: JumpArgs): HexString {
        const builder = new BytesBuilder()
        builder.addUint16(args.nextPC)

        return new HexString(add0x(builder.asHex()))
    }

    decode(data: HexString): JumpArgs {
        const iter = BytesIter.HexString(data.toString())
        const nextPC = BigInt(iter.nextUint16())

        return new JumpArgs(nextPC)
    }
}
