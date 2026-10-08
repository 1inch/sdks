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

  /**
   * Exact salt bytes, as encoded into the program
   **/
  public readonly bytes: HexString

  /**
   * Numeric value of the salt bytes (0n for an empty salt)
   **/
  public readonly salt: bigint

  /**
   * salt - uint64 value (encoded as 8 bytes) or raw salt bytes of any length (kept verbatim)
   **/
  constructor(salt: bigint | HexString) {
    if (typeof salt === 'bigint') {
      assert(
        salt >= 0n && salt <= UINT_64_MAX,
        `Invalid salt value: ${salt}. Must be a valid uint64`,
      )

      this.salt = salt
      this.bytes = new HexString(new BytesBuilder().addUint64(salt).asHex())

      return
    }

    this.bytes = salt
    this.salt = salt.isEmpty() ? 0n : salt.toBigInt()
  }

  /**
   * Decodes hex data into SaltArgs instance
   **/
  static decode(data: HexString): SaltArgs {
    return SaltArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      salt: this.salt.toString(),
      bytes: this.bytes.toString(),
    }
  }
}
