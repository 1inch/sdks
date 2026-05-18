// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'

export type TokenReserveArgs = {
  token: Address
  reserve: bigint
}

/** Snapshot from `TokenReserve.prototype.toJSON` (reserve as decimal string). */
export type TokenReserveJSON = {
  token: string
  reserve: string
}
