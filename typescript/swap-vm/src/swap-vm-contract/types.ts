import type { Address, HexString } from '@1inch/sdk-core'
import type { TakerTraits } from '../swap-vm'
import type { Order } from '../swap-vm/order'

type SwapVmSwapInfo = {
  order: Order
  tokenIn: Address
  tokenOut: Address
  amount: bigint
  takerTraits: TakerTraits

  /**
   * Optional additional data (hook data, etc.)
   */
  takerData?: HexString
}
export type QuoteArgs = SwapVmSwapInfo

export type QuoteNonViewArgs = SwapVmSwapInfo

export type SwapArgs = SwapVmSwapInfo & {
  /**
   * Optional - not needed if using Aqua
   */
  signature?: HexString
}

export type QuoteResult = {
  amountIn: bigint
  amountOut: bigint
}

export type SwapResult = {
  amountIn: bigint
  amountOut: bigint
  orderHash: HexString
}
