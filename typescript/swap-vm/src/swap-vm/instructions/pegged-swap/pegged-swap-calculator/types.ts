// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { PeggedTokenRef } from '../price/types'

export type PeggedSwapCalculatorArgs = {
  tokenA: PeggedTokenRef
  tokenB: PeggedTokenRef
}

export type PeggedInitialBalances = {
  reserveLt: bigint
  reserveGt: bigint
}
