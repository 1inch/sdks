import {assertString} from '../validators/should-be-string'
import {assertNotEmpty} from '../validators/should-not-be-empty'
import {assertHexString} from '../validators/should-be-hex-string'

export class HexString {
    private readonly hexString: `0x${string}`

    constructor(hex: unknown, name = '') {
        assertString(hex, `hexString ${name}`)
        assertNotEmpty(hex, `hexString ${name}`)
        assertHexString(hex, `hexString ${name}`)

        this.hexString = hex
    }

    static fromBigInt(bigInt: bigint, name?: string): HexString {
        return new HexString(`0x${bigInt.toString(16)}`, name)
    }

    static fromUnknown(val: unknown, name?: string): HexString {
        if (typeof val === 'bigint') {
            return HexString.fromBigInt(val, name)
        }

        if (typeof val === 'string') {
            return new HexString(val, name)
        }

        throw new Error(`Invalid hex string${name ? ' ' + name : ''}`)
    }

    toBigInt(): bigint {
        return BigInt(this.hexString)
    }

    toString(): string {
        return this.hexString
    }

    toJSON(): string {
        return this.hexString
    }
}
