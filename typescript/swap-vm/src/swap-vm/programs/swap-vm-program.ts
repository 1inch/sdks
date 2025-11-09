import { assertHexString } from '@1inch/sdk-shared'

/**
 * Represents encoded SwapVM program bytecode
 **/
export class SwapVmProgram {
  private readonly value: `0x${string}`

  constructor(val: string) {
    assertHexString(val)

    this.value = val
  }

  /**
   * Returns the program bytecode as a hex string
   **/
  toString(): `0x${string}` {
    return this.value
  }
}
