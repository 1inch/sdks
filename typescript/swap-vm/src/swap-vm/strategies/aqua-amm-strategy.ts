// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'
import { AquaProgramBuilder } from '../programs/aqua-program-builder'
import type { SwapVmProgram } from '../programs'
import * as concentrate from '../instructions/concentrate'
import * as fee from '../instructions/fee'
import { FlatFeeArgs } from '../instructions/fee'

/**
 * Aqua AMM Strategy builder that mirrors AquaAMM.sol
 * @see https://github.com/1inch/swap-vm/blob/main/src/strategies/AquaAMM.sol
 */
export class AquaAMMStrategy {
  feeBpsIn?: number

  deltas?: { a: bigint; b: bigint }

  decayPeriod?: bigint

  protocolFee?: {
    bps: number
    receiver: Address
  }

  salt?: bigint

  constructor(
    public readonly tokenA: Address,
    public readonly tokenB: Address,
  ) {}

  static new(tokens: { tokenA: Address; tokenB: Address }): AquaAMMStrategy {
    return new AquaAMMStrategy(tokens.tokenA, tokens.tokenB)
  }

  public withProtocolFee(bps: number, receiver: Address): this {
    this.protocolFee = { bps, receiver }

    return this
  }

  public withDeltas(a: bigint, b: bigint): this {
    this.deltas = { a, b }

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

  public withSalt(salt: bigint): this {
    this.salt = salt

    return this
  }

  public build(): SwapVmProgram {
    const builder = new AquaProgramBuilder()

    if (this.deltas) {
      const data = concentrate.ConcentrateGrowLiquidity2DArgs.fromTokenDeltas(
        this.tokenA,
        this.tokenB,
        this.deltas.a,
        this.deltas.b,
      )

      builder.add(concentrate.concentrateGrowLiquidity2D.createIx(data))
    }

    if (this.decayPeriod) {
      builder.decayXD({ decayPeriod: this.decayPeriod })
    }

    if (this.feeBpsIn) {
      const data = FlatFeeArgs.fromBps(this.feeBpsIn)
      builder.add(fee.flatFeeAmountInXD.createIx(data))
    }

    if (this.protocolFee) {
      const data = fee.ProtocolFeeArgs.fromBps(this.protocolFee.bps, this.protocolFee.receiver)
      builder.add(fee.aquaProtocolFeeAmountOutXD.createIx(data))
    }

    builder.xycSwapXD()

    if (this.salt) {
      builder.salt({ salt: this.salt })
    }

    return builder.build()
  }
}
