// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { type Address, type Bps } from '@1inch/sdk-core'
import { FlatFeeArgs, ProtocolFeeArgs } from '../instructions/fee'

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

  public withSalt(salt: bigint): this {
    this.salt = salt

    return this
  }
}
