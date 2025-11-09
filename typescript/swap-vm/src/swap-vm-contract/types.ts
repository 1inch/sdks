import { Address, HexString } from '@1inch/sdk-shared'
import { TakerTraits } from '../swap-vm'
import { Order } from '../swap-vm/order'

export type QuoteArgs = {
  order: Order
  tokenIn: Address
  tokenOut: Address
  amount: bigint
  takerTraits: TakerTraits
  takerData: HexString
}

export type QuoteNonViewArgs = {
  order: Order
  tokenIn: Address
  tokenOut: Address
  amount: bigint
  takerTraits: TakerTraits
  takerData: HexString
}

export type SwapArgs = {
  order: Order
  tokenIn: Address
  tokenOut: Address
  amount: bigint
  /**
   * Optional - not needed if using Aqua
   */
  signature?: HexString
  takerTraits: TakerTraits
  /**
   * Optional additional data (hook data, etc.)
   */
  additionalData?: HexString
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
