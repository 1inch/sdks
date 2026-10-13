// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address, Bps, Percent } from '@1inch/sdk-core'
import { FlatFeeArgs, ProtocolFeeArgs } from '../instructions/fee'

function feeUnits(fee: number | Bps | Percent): bigint {
  if (typeof fee === 'number') {
    return BigInt(fee)
  }

  return fee.toScaledBigInt()
}

export abstract class AquaAMMStrategy {
  feeBpsIn?: number

  decayPeriod?: bigint

  protocolFee?: {
    bps: number
    receiver: Address
  }

  accessToken?: Address

  salt?: bigint

  private feeTokenInRaw?: FlatFeeArgs

  private protocolFeeRaw?: ProtocolFeeArgs

  protected constructor() {}

  /**
   * Sets the protocol fee taken from amountIn, in basis points (e.g. `1.1`)
   * @throws if `bps` is not a finite non-negative number or exceeds 100%
   */
  public withProtocolFee(bps: number, receiver: Address): this {
    ProtocolFeeArgs.fromBps(bps, receiver)

    this.protocolFee = { bps, receiver }
    this.protocolFeeRaw = undefined

    return this
  }

  /**
   * Sets the protocol fee taken from amountIn, in fee units (1e9 = 100%, 1 bps = 100_000)
   * @throws if `fee` is negative or exceeds 100%
   */
  public withProtocolFeeRaw(fee: number | Bps | Percent, receiver: Address): this {
    this.protocolFeeRaw = new ProtocolFeeArgs(feeUnits(fee), receiver)
    this.protocolFee = undefined

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
    this.feeTokenInRaw = undefined

    return this
  }

  /**
   * Sets the taker fee on amountIn, in fee units (1e9 = 100%, 1 bps = 100_000)
   * @throws if `fee` is negative or exceeds 100%
   */
  public withFeeTokenInRaw(fee: number | Bps | Percent): this {
    this.feeTokenInRaw = new FlatFeeArgs(feeUnits(fee))
    this.feeBpsIn = undefined

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

  /**
   * Protocol fee set last, in bps (`withProtocolFee` / `protocolFee`) or in fee units (`withProtocolFeeRaw`).
   * The raw setter clears `protocolFee`, so a defined `protocolFee` was set after it
   */
  protected protocolFeeArgs(): ProtocolFeeArgs | undefined {
    if (this.protocolFee) {
      return ProtocolFeeArgs.fromBps(this.protocolFee.bps, this.protocolFee.receiver)
    }

    return this.protocolFeeRaw
  }

  /**
   * Taker fee set last, in bps (`withFeeTokenIn` / `feeBpsIn`) or in fee units (`withFeeTokenInRaw`).
   * The raw setter clears `feeBpsIn`, so a defined `feeBpsIn` was set after it
   */
  protected feeTokenInArgs(): FlatFeeArgs | undefined {
    if (this.feeBpsIn !== undefined) {
      return FlatFeeArgs.fromBps(this.feeBpsIn)
    }

    return this.feeTokenInRaw
  }
}
