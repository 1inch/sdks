import {BytesBuilder, BytesIter, add0x} from '@1inch/byte-utils'
import {HexString} from '@1inch/sdk-shared'
import {SaltArgs} from './salt-args'
import {IArgsCoder} from '../types'

export class SaltArgsCoder implements IArgsCoder<SaltArgs> {
    encode(args: SaltArgs): HexString {
        const builder = new BytesBuilder()
        builder.addUint64(args.salt)

        return new HexString(add0x(builder.asHex()))
    }

    decode(data: HexString): SaltArgs {
        const iter = BytesIter.HexString(data.toString())
        const bytes = iter.nextUint64()
        const salt = BigInt(add0x(bytes))

        return new SaltArgs(salt)
    }
}
