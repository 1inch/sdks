import type { Address, HexString } from '@1inch/sdk-core'
import { ExtructionArgsCoder } from './extruction-args-coder'
import type { IArgsData } from '../types'

/**
 * Arguments for extruction instruction to call external contract logic
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Extruction.sol#L33
 **/
export class ExtructionArgs implements IArgsData {
  public static readonly CODER = new ExtructionArgsCoder()

  /**
   * target - External contract address (20 bytes)
   * extructionArgs - Arguments to pass to external contract (variable)
   **/
  constructor(
    public readonly target: Address,
    public readonly extructionArgs: HexString,
  ) {}

  /**
   * Decodes hex data into ExtructionArgs instance
   **/
  static decode(data: HexString): ExtructionArgs {
    return ExtructionArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      target: this.target.toString(),
      extructionArgs: this.extructionArgs.toString(),
    }
  }
}
