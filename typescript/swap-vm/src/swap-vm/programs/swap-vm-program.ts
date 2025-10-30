import {assertHexString, assertNotEmpty, assertString} from '@1inch/sdk-shared'

/**
 * Represents encoded SwapVM program bytecode
 **/
export class SwapVmProgram {
    private readonly value: `0x${string}`

    constructor(val: unknown) {
        assertString(val)
        assertNotEmpty(val)
        assertHexString(val)

        this.value = val
    }

    /**
     * Returns the program bytecode as a hex string
     **/
    toString(): string {
        return this.value
    }
}
