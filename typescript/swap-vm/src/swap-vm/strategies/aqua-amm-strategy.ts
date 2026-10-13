// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { Bps, type Address, type Percent } from '@1inch/sdk-core'
import { FlatFeeArgs, ProtocolFeeArgs } from '../instructions/fee'

function feeUnits(fee: number | Bps | Percent): bigint {
  if (typeof fee === 'number') {
    return BigInt(fee)
  }

  return fee.toScaledBigInt()
}

export abstract class AquaAMMStrategy {
  /** Taker fee in basis points. */
  feeBpsIn?: number

  decayPeriod?: bigint

  /** Protocol fee. `bps` is always basis points. */
  protocolFee?: {
    bps: number
    receiver: Address
  }

  accessToken?: Address

  salt?: bigint

  protected constructor() {}

  /**
   * Sets the protocol fee taken from amountIn, in basis points (e.g. `1.1`)
   * @throws if `bps` is not a finite non-negative number or exceeds 100%
   */
  public withProtocolFee(bps: number, receiver: Address): this {
    ProtocolFeeArgs.fromBps(bps, receiver)

    this.protocolFee = { bps, receiver }

    return this
  }

  /**
   * Sets the protocol fee taken from amountIn, in fee units (1e9 = 100%, 1 bps = 100_000)
   * @throws if `fee` is negative or exceeds 100%
   */
  public withProtocolFeeRaw(fee: number | Bps | Percent, receiver: Address): this {
    const units = feeUnits(fee)

    new ProtocolFeeArgs(units, receiver)

    this.protocolFee = {
      bps: Bps.fromScaledBigInt(units).toNumber(),
      receiver,
    }

    return this
  }

  public withDecayPeriod(decayPeriod: bigint): this {
    this.decayPeriod = decayPeriod

    return this
  }

  /**
   * Sets the taker fee on amountIn, in basis points (e.g. `1.1`)
   * @throws if `bps` is not a finite non-negative number or exceeds 100%
   */
  public withFeeTokenIn(bps: number): this {
    FlatFeeArgs.fromBps(bps)

    this.feeBpsIn = bps

    return this
  }

  /**
   * Sets the taker fee on amountIn, in fee units (1e9 = 100%, 1 bps = 100_000)
   * @throws if `fee` is negative or exceeds 100%
   */
  public withFeeTokenInRaw(fee: number | Bps | Percent): this {
    const units = feeUnits(fee)

    new FlatFeeArgs(units)

    this.feeBpsIn = Bps.fromScaledBigInt(units).toNumber()

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

  protected protocolFeeArgs(): ProtocolFeeArgs | undefined {
    if (!this.protocolFee) {
      return undefined
    }

    return ProtocolFeeArgs.fromBps(this.protocolFee.bps, this.protocolFee.receiver)
  }

  protected feeTokenInArgs(): FlatFeeArgs | undefined {
    if (this.feeBpsIn === undefined) {
      return undefined
    }

    return FlatFeeArgs.fromBps(this.feeBpsIn)
  }
}
