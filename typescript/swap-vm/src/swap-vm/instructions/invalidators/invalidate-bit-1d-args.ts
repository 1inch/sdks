import type { HexString } from '@1inch/sdk-core'
import { UINT_32_MAX } from '@1inch/byte-utils'
import assert from 'node:assert'
import { InvalidateBit1DArgsCoder } from './invalidate-bit-1d-args-coder'
import type { IArgsData } from '../types'

/**
 * Arguments for invalidateBit1D instruction to invalidate a specific bit index
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Invalidators.sol#L75
 **/
export class InvalidateBit1DArgs implements IArgsData {
  public static readonly CODER = new InvalidateBit1DArgsCoder()

  constructor(public readonly bitIndex: bigint) {
    assert(
      bitIndex >= 0n && bitIndex <= UINT_32_MAX,
      `Invalid bitIndex value: ${bitIndex}. Must be a valid uint32`,
    )
  }

  /**
   * Decodes hex data into InvalidateBit1DArgs instance
   **/
  static decode(data: HexString): InvalidateBit1DArgs {
    return InvalidateBit1DArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      bitIndex: this.bitIndex.toString(),
    }
  }
}
