// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'

export type TokenBalance = {
  token: Address
  value: bigint
}
