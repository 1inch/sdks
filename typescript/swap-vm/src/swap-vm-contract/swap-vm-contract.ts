import {encodeFunctionData} from 'viem'
import {CallInfo, Address, HexString} from '@1inch/sdk-shared'
import {BytesBuilder, trim0x} from '@1inch/byte-utils'
import assert from 'node:assert'
import {QuoteArgs, QuoteNonViewArgs, SwapArgs, Order} from './types'
import {TakerTraits} from '../swap-vm'
import SWAP_VM_ABI from '../abi/SwapVM.abi.json' with {type: 'json'}

/**
 * SwapVM contract encoding/decoding utilities
 */
export class SwapVMContract {
    /**
     * Encode quote function call data
     * @see https://github.com/1inch/swap-vm/blob/main/src/SwapVM.sol#L84
     */
    static encodeQuoteCallData(args: QuoteArgs): HexString {
        const takerTraitsAndData = this.buildTakerTraitsAndData(
            args.takerTraits,
            args.takerData
        )

        const result = encodeFunctionData({
            abi: SWAP_VM_ABI,
            functionName: 'quote',
            args: [
                {
                    maker: args.order.maker.toString(),
                    traits: args.order.traits.asBigInt(),
                    program: args.order.program.toString()
                },
                args.tokenIn.toString(),
                args.tokenOut.toString(),
                args.amount,
                takerTraitsAndData.toString()
            ]
        })

        return new HexString(result)
    }

    /**
     * Encode quoteNonView function call data
     * @see https://github.com/1inch/swap-vm/blob/main/src/SwapVM.sol#L109
     */
    static encodeQuoteNonViewCallData(args: QuoteNonViewArgs): HexString {
        const takerTraitsAndData = this.buildTakerTraitsAndData(
            args.takerTraits,
            args.takerData
        )

        const result = encodeFunctionData({
            abi: SWAP_VM_ABI,
            functionName: 'quoteNonView',
            args: [
                {
                    maker: args.order.maker.toString(),
                    traits: args.order.traits.asBigInt(),
                    program: args.order.program.toString()
                },
                args.tokenIn.toString(),
                args.tokenOut.toString(),
                args.amount,
                takerTraitsAndData.toString()
            ]
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
            args.additionalData
        )

        const result = encodeFunctionData({
            abi: SWAP_VM_ABI,
            functionName: 'swap',
            args: [
                {
                    maker: args.order.maker.toString(),
                    traits: args.order.traits.asBigInt(),
                    program: args.order.program.toString()
                },
                args.tokenIn.toString(),
                args.tokenOut.toString(),
                args.amount,
                sigPlusTakerTraitsAndData.toString()
            ]
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
            value: 0n
        }
    }

    /**
     * Build quoteNonView transaction
     */
    static buildQuoteNonViewTx(
        contractAddress: Address,
        args: QuoteNonViewArgs
    ): CallInfo {
        return {
            to: contractAddress.toString(),
            data: this.encodeQuoteNonViewCallData(args).toString(),
            value: 0n
        }
    }

    /**
     * Build swap transaction
     */
    static buildSwapTx(contractAddress: Address, args: SwapArgs): CallInfo {
        return {
            to: contractAddress.toString(),
            data: this.encodeSwapCallData(args).toString(),
            value: 0n
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
        additionalData?: HexString
    ): HexString {
        const useAquaInsteadOfSignature =
            order.traits.isUseOfAquaInsteadOfSignatureEnabled()

        const builder = new BytesBuilder()

        if (!useAquaInsteadOfSignature) {
            assert(
                signature,
                'signature required when useOfAquaInsteadOfSignature disabled'
            )
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
        additionalData?: HexString
    ): HexString {
        const traitsBytes = takerTraits.encode()

        return new HexString(
            traitsBytes.toString() +
                (additionalData !== undefined
                    ? trim0x(additionalData.toString())
                    : '')
        )
    }
}
