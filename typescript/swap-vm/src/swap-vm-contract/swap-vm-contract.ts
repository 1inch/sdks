// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { encodeFunctionData } from 'viem'
import type { CallInfo, Address } from '@1inch/sdk-core'
import { HexString } from '@1inch/sdk-core'
import type { QuoteArgs, SwapArgs } from './types'
import { SWAP_VM_ABI } from '../abi/SwapVM.abi'
import type { Order } from '../swap-vm/order'

/**
 * SwapVM contract encoding/decoding utilities
 */
export class SwapVMContract {
  constructor(public readonly address: Address) {}

  /**
   * Encode quote function call data
   * @see https://github.com/1inch/swap-vm/blob/main/src/SwapVM.sol#L84
   */
  static encodeQuoteCallData(args: QuoteArgs): HexString {
    const result = encodeFunctionData({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      args: [
        args.order.build(),
        args.tokenIn.toString(),
        args.tokenOut.toString(),
        args.amount,
        args.takerTraits.encode().toString(),
      ],
    })

    return new HexString(result)
  }

  /**
   * Encode `hashOrder` function call data
   * @see https://github.com/1inch/swap-vm/blob/main/src/SwapVM.sol#L70
   */
  static encodeHashOrderCallData(order: Order): HexString {
    const result = encodeFunctionData({
      abi: SWAP_VM_ABI,
      functionName: 'hash',
      args: [order.build()],
    })

    return new HexString(result)
  }

  /**
   * Encode swap function call data
   * @see https://github.com/1inch/swap-vm/blob/main/src/SwapVM.sol#L124
   */
  static encodeSwapCallData(args: SwapArgs): HexString {
    const result = encodeFunctionData({
      abi: SWAP_VM_ABI,
      functionName: 'swap',
      args: [
        args.order.build(),
        args.tokenIn.toString(),
        args.tokenOut.toString(),
        args.amount,
        args.takerTraits.encode().toString(),
      ],
    })

    return new HexString(result)
  }

  /**
   * Build quote transaction
   */
  static buildQuoteTx(contractAddress: Address, args: QuoteArgs): CallInfo {
    return {
      to: contractAddress.toString(),
      data: this.encodeQuoteCallData(args).toString(),
      value: 0n,
    }
  }

  /**
   * Build swap transaction
   */
  static buildSwapTx(contractAddress: Address, args: SwapArgs): CallInfo {
    return {
      to: contractAddress.toString(),
      data: this.encodeSwapCallData(args).toString(),
      value: 0n,
    }
  }

  static buildHashOrderTx(contractAddress: Address, order: Order): CallInfo {
    return {
      to: contractAddress.toString(),
      data: this.encodeHashOrderCallData(order).toString(),
      value: 0n,
    }
  }

  public swap(args: SwapArgs): CallInfo {
    return SwapVMContract.buildSwapTx(this.address, args)
  }

  public quote(args: QuoteArgs): CallInfo {
    return SwapVMContract.buildQuoteTx(this.address, args)
  }

  public hashOrder(order: Order): CallInfo {
    return SwapVMContract.buildHashOrderTx(this.address, order)
  }
}
