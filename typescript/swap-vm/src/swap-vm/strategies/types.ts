// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'

export type PeggedTokenInfo = { address: Address; decimals: number; reserve: bigint }

export type PeggedArgs = {
  tokenA: PeggedTokenInfo
  tokenB: PeggedTokenInfo
  linearWidth: bigint
}
