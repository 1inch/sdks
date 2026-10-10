// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'
import assert from 'assert'

export abstract class AquaAMMStrategy {
  feeBpsIn?: number

  decayPeriod?: bigint

  protocolFee?: {
    bps: number
    receiver: Address
  }

  accessToken?: Address

  salt?: bigint

  protected constructor() {}

  public withProtocolFee(bps: number, receiver: Address): this {
    this.protocolFee = { bps, receiver }

    return this
  }

  public withDecayPeriod(decayPeriod: bigint): this {
    this.decayPeriod = decayPeriod

    return this
  }

  public withFeeTokenIn(bps: number): this {
    this.feeBpsIn = bps

    return this
  }

  public withTxOriginAccessToken(token: Address): this {
    this.accessToken = token

    return this
  }

  /**
   * Adds a salt instruction with the given uint64 value to the program (`0n` included).
   *
   * Aqua keeps a maker's balances per strategy hash, and `ship()` accepts new tokens for a hash that
   * already holds balances. Without a salt the hash is fully determined by the maker, the traits and
   * the strategy parameters, so shipping identical parameters for two token pairs puts both pairs
   * under one hash and lets takers swap across them. A salt that is unique per shipped strategy keeps
   * each strategy's tokens isolated (see {@link withRandomSalt}).
   *
   * Keep the salt (or the built strategy bytes) to recompute the strategy hash for docking.
   */
  public withSalt(salt: bigint): this {
    this.salt = salt

    return this
  }

  /**
   * Sets a random uint64 salt from a cryptographically secure RNG (`globalThis.crypto.getRandomValues`),
   * so the strategy hash is unique even if another strategy has identical parameters.
   *
   * The salt cannot be derived from the strategy parameters: persist `salt` (or keep the built
   * strategy bytes) to recompute the strategy hash for docking.
   */
  public withRandomSalt(): this {
    assert(
      typeof globalThis.crypto?.getRandomValues === 'function',
      'globalThis.crypto.getRandomValues is required to generate a random salt',
    )

    const [salt] = globalThis.crypto.getRandomValues(new BigUint64Array(1))

    return this.withSalt(salt)
  }
}
