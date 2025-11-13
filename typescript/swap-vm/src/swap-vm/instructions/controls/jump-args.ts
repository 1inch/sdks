import type { HexString } from '@1inch/sdk-core'
import assert from 'node:assert'
import { JumpArgsCoder } from './jump-args-coder'
import type { IArgsData } from '../types'

const UINT_16_MAX = 0xffffn

/**
 * Arguments for jump instructions containing target program counter
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Controls.sol#L10
 **/
export class JumpArgs implements IArgsData {
  public static readonly CODER = new JumpArgsCoder()

  constructor(public readonly nextPC: bigint) {
    assert(
      nextPC <= UINT_16_MAX && nextPC >= 0n,
      `Invalid nextPC value: ${nextPC}. Must be between 0 and 65535`,
    )
  }

  /**
   * Decodes hex data into JumpArgs instance
   **/
  static decode(data: HexString): JumpArgs {
    return JumpArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      nextPC: this.nextPC,
    }
  }
}
