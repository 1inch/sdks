// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { AquaAMMStrategy } from './aqua-amm-strategy'
import type { PeggedArgs, PeggedTokenInfo } from './types'
import { AquaProgramBuilder } from '../programs/aqua-program-builder'
import type { SwapVmProgram } from '../programs'
import * as fee from '../instructions/fee'
import { FlatFeeArgs } from '../instructions/fee'
import { PeggedSwapArgs } from '../instructions/pegged-swap'

export class AquaPeggedAmmStrategy extends AquaAMMStrategy {
  constructor(
    public readonly tokenA: PeggedTokenInfo,
    public readonly tokenB: PeggedTokenInfo,
    public readonly linearWidth: bigint,
  ) {
    super()
  }

  static new(data: PeggedArgs): AquaPeggedAmmStrategy {
    return new AquaPeggedAmmStrategy(data.tokenA, data.tokenB, data.linearWidth)
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

    if (this.decayPeriod) {
      builder.decayXD({ decayPeriod: this.decayPeriod })
    }

    if (this.feeBpsIn) {
      const data = FlatFeeArgs.fromBps(this.feeBpsIn)
      builder.add(fee.flatFeeAmountInXD.createIx(data))
    }

    const peggedArgs = PeggedSwapArgs.fromTokens(
      {
        address: this.tokenA.address,
        decimals: this.tokenA.decimals,
        reserve: this.tokenA.reserve,
      },
      {
        address: this.tokenB.address,
        decimals: this.tokenB.decimals,
        reserve: this.tokenB.reserve,
      },
      this.linearWidth,
    )

    builder.peggedSwapGrowPriceRange2D(peggedArgs)

    if (this.salt) {
      builder.salt({ salt: this.salt })
    }

    return builder.build()
  }
}
