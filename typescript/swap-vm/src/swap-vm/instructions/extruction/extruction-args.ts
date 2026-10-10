// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address, HexString } from '@1inch/sdk-core'
import { ExtructionArgsCoder } from './extruction-args-coder'
import type { IArgsCoder, IArgsData } from '../types'

/**
 * Arguments for extruction instruction to call external contract logic
 *
 * `target` is called in both `quote()` (`IStaticExtruction`) and `swap()` (`IExtruction`) and can
 * change control flow and swap amounts. Both implementations must be deterministic and return the
 * same results for the same inputs, and the target should be immutable (non-upgradeable).
 * Takers/resolvers must validate the target before routing to a strategy that uses it.
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Extruction.sol#L33
 **/
export class ExtructionArgs implements IArgsData {
  public static readonly CODER: IArgsCoder<ExtructionArgs> = new ExtructionArgsCoder()

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
