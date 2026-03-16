// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'
import { AquaAMMStrategy } from './aqua-amm-strategy'
import { AquaProgramBuilder } from '../programs/aqua-program-builder'
import type { SwapVmProgram } from '../programs'
import * as concentrate from '../instructions/concentrate'
import * as fee from '../instructions/fee'
import { FlatFeeArgs } from '../instructions/fee'

export class AquaXYCAmmStrategy extends AquaAMMStrategy {
  deltas?: { a: bigint; b: bigint }

  constructor(
    public readonly tokenA: Address,
    public readonly tokenB: Address,
  ) {
    super()
  }

  static new(tokens: { tokenA: Address; tokenB: Address }): AquaXYCAmmStrategy {
    return new AquaXYCAmmStrategy(tokens.tokenA, tokens.tokenB)
  }

  public withDeltas(a: bigint, b: bigint): this {
    this.deltas = { a, b }

    return this
  }

  public build(): SwapVmProgram {
    const builder = new AquaProgramBuilder()

    if (this.protocolFee) {
      const data = fee.ProtocolFeeArgs.fromBps(this.protocolFee.bps, this.protocolFee.receiver)
      builder.add(fee.aquaProtocolFeeAmountInXD.createIx(data))
    }

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

    builder.xycSwapXD()

    if (this.salt) {
      builder.salt({ salt: this.salt })
    }

    return builder.build()
  }
}
