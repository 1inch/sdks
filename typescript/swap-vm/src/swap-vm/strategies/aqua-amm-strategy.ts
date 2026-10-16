// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { type Address, type Bps } from '@1inch/sdk-core'

import { FlatFeeArgs, ProtocolFeeArgs } from '../instructions/fee'
import { assert } from '../../utils/assert'

export abstract class AquaAMMStrategy {
  /** Taker fee taken from amountIn. */
  feeBpsIn?: FlatFeeArgs

  decayPeriod?: bigint

  /** Protocol fee taken from amountIn. */
  protocolFee?: ProtocolFeeArgs

  accessToken?: Address

  salt?: bigint

  protected constructor() {}

  /**
   * Sets the protocol fee taken from amountIn, in basis points (e.g. `1.1` or a {@link Bps})
   * @throws if `bps` is not a finite non-negative number or exceeds 100%
   */
  public withProtocolFee(bps: Bps, receiver: Address): this

  public withProtocolFee(bps: number, receiver: Address): this

  public withProtocolFee(bps: number | Bps, receiver: Address): this {
    this.protocolFee = ProtocolFeeArgs.fromBps(bps, receiver)

    return this
  }

  public withDecayPeriod(decayPeriod: bigint): this {
    this.decayPeriod = decayPeriod

    return this
  }

  /**
   * Sets the taker fee on amountIn, in basis points (e.g. `1.1` or a {@link Bps})
   * @throws if `bps` is not a finite non-negative number or exceeds 100%
   */
  public withFeeTokenIn(bps: Bps): this

  public withFeeTokenIn(bps: number): this

  public withFeeTokenIn(bps: number | Bps): this {
    this.feeBpsIn = FlatFeeArgs.fromBps(bps)

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
