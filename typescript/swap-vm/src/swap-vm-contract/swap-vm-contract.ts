import { encodeFunctionData } from 'viem'
import type { CallInfo, Address } from '@1inch/sdk-core'
import { HexString } from '@1inch/sdk-core'
import { BytesBuilder, trim0x } from '@1inch/byte-utils'
import assert from 'node:assert'
import type { QuoteArgs, SwapArgs } from './types'
import type { TakerTraits } from '../swap-vm'
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
    const takerTraitsAndData = this.buildTakerTraitsAndData(args.takerTraits, args.takerData)

    const result = encodeFunctionData({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      args: [
        args.order.build(),
        args.tokenIn.toString(),
        args.tokenOut.toString(),
        args.amount,
        takerTraitsAndData.toString(),
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
    const sigPlusTakerTraitsAndData = this.buildSigPlusTakerTraitsAndData(
      args.order,
      args.takerTraits,
      args.signature,
      args.takerData,
    )

    const result = encodeFunctionData({
      abi: SWAP_VM_ABI,
      functionName: 'swap',
      args: [
        args.order.build(),
        args.tokenIn.toString(),
        args.tokenOut.toString(),
        args.amount,
        sigPlusTakerTraitsAndData.toString(),
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

  /**
   * Build sigPlusTakerTraitsAndData parameter from components
   * Structure depends on whether signature is required or using Aqua
   */
  private static buildSigPlusTakerTraitsAndData(
    order: Order,
    takerTraits: TakerTraits,
    signature?: HexString,
    additionalData?: HexString,
  ): HexString {
    const useAquaInsteadOfSignature = order.traits.useAquaInsteadOfSignature

    const builder = new BytesBuilder()

    if (!useAquaInsteadOfSignature) {
      assert(signature, 'signature required when useOfAquaInsteadOfSignature disabled')
      const sigBytes = trim0x(signature.toString())
      builder.addUint16(BigInt(sigBytes.length / 2))
      builder.addBytes(signature.toString())
    }

    builder.addBytes(takerTraits.encode().toString())

    if (additionalData) {
      builder.addBytes(additionalData.toString())
    }

    return new HexString(builder.asHex())
  }

  /**
   * Build takerTraitsAndData parameter from components
   * Simple concatenation of traits and additional data
   */
  private static buildTakerTraitsAndData(
    takerTraits: TakerTraits,
    additionalData?: HexString,
  ): HexString {
    const traitsBytes = takerTraits.encode()

    return new HexString(
      traitsBytes.toString() +
        (additionalData !== undefined ? trim0x(additionalData.toString()) : ''),
    )
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
