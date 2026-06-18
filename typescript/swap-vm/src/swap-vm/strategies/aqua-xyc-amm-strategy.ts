// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { AquaAMMStrategy } from './aqua-amm-strategy'
import type { ConcentrateRawPrices, ConcentrateSqrtPrices } from './types'
import { AquaProgramBuilder } from '../programs/aqua-program-builder'
import type { SwapVmProgram } from '../programs'
import * as concentrate from '../instructions/concentrate'
import * as fee from '../instructions/fee'
import { FlatFeeArgs } from '../instructions/fee'

export class AquaXYCAmmStrategy extends AquaAMMStrategy {
  constructor(public readonly xycConcentrateArgs?: concentrate.ConcentrateGrowLiquidity2DArgs) {
    super()
  }

  static new(): AquaXYCAmmStrategy {
    return new AquaXYCAmmStrategy()
  }

  static newConcentrate(prices: ConcentrateRawPrices | ConcentrateSqrtPrices): AquaXYCAmmStrategy {
    if ('rawPriceMin' in prices && 'rawPriceMax' in prices) {
      const args = concentrate.ConcentrateGrowLiquidity2DArgs.fromRawPrices(
        prices.rawPriceMin,
        prices.rawPriceMax,
      )

      return new AquaXYCAmmStrategy(args)
    }

    if ('sqrtPriceMin' in prices && 'sqrtPriceMax' in prices) {
      const args = concentrate.ConcentrateGrowLiquidity2DArgs.fromSqrtPrices(
        prices.sqrtPriceMin,
        prices.sqrtPriceMax,
      )

      return new AquaXYCAmmStrategy(args)
    }

    throw new Error('unknown parameters for newXYCConcentrate')
  }

  public build(): SwapVmProgram {
    const builder = new AquaProgramBuilder()

    if (this.accessToken) {
      builder.onlyTxOriginTokenBalanceNonZero({ token: this.accessToken })
    }

    if (this.protocolFee) {
      const data = fee.ProtocolFeeArgs.fromBps(this.protocolFee.bps, this.protocolFee.receiver)
      builder.add(fee.aquaProtocolFeeAmountInXD.createIx(data))
    }

    if (this.xycConcentrateArgs) {
      builder.add(concentrate.concentrateGrowLiquidity2D.createIx(this.xycConcentrateArgs))
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
