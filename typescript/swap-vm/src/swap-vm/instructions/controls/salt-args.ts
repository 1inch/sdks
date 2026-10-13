// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { HexString } from '@1inch/sdk-core'
import { BytesBuilder, UINT_64_MAX } from '@1inch/byte-utils'
import assert from 'assert'
import { SaltArgsCoder } from './salt-args-coder'
import type { IArgsCoder, IArgsData } from '../types'

/**
 * Arguments for salt instruction used to add uniqueness to order hashes.
 * The VM ignores the salt args, so on-chain a salt is arbitrary bytes of any length (including empty)
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Controls.sol#L48
 **/
export class SaltArgs implements IArgsData {
  public static readonly CODER: IArgsCoder<SaltArgs> = new SaltArgsCoder()

  constructor(public readonly bytes: HexString) {}

  static fromUint64(salt: bigint): SaltArgs {
    assert(salt >= 0n && salt <= UINT_64_MAX, `Invalid salt value: ${salt}. Must be a valid uint64`)

    return new SaltArgs(new HexString(new BytesBuilder().addUint64(salt).asHex()))
  }

  static decode(data: HexString): SaltArgs {
    return SaltArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      bytes: this.bytes.toString(),
    }
  }
}
