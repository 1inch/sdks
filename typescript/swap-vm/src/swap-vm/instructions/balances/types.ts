// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { AddressHalf } from '@1inch/sdk-core'

export type TokenBalance = {
  tokenHalf: AddressHalf
  value: bigint
}
