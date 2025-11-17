// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address, HexString } from '@1inch/sdk-core'
import type { TakerTraits } from '../swap-vm'
import type { Order } from '../swap-vm/order'

type SwapVmSwapInfo = {
  order: Order
  tokenIn: Address
  tokenOut: Address
  amount: bigint
  takerTraits: TakerTraits
}
export type QuoteArgs = SwapVmSwapInfo

export type SwapArgs = SwapVmSwapInfo

export type QuoteResult = {
  amountIn: bigint
  amountOut: bigint
}

export type SwapResult = {
  amountIn: bigint
  amountOut: bigint
  orderHash: HexString
}
