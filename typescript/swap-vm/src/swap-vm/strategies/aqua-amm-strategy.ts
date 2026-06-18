// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'

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

  public withSalt(salt: bigint): this {
    this.salt = salt

    return this
  }
}
