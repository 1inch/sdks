import {assertHexString, assertNotEmpty, assertString} from '@1inch/sdk-shared'

export class SwapVmProgram {
    private readonly value: `0x${string}`

    constructor(val: unknown) {
        assertString(val)
        assertNotEmpty(val)
        assertHexString(val)

        this.value = val
    }

    toString(): string {
        return this.value
    }
}
