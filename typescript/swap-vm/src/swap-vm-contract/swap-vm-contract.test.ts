import {describe, it, expect} from 'vitest'
import {Address, HexString} from '@1inch/sdk-shared'
import {SwapVMContract} from './swap-vm-contract'
import {MakerTraits, TakerTraits} from '../swap-vm'
import {SwapVmProgram} from '../swap-vm/programs/swap-vm-program'

describe('SwapVMContract', () => {
    const mockMaker = new Address('0x1234567890123456789012345678901234567890')
    const mockTokenIn = new Address(
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    ) // USDC
    const mockTokenOut = new Address(
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    ) // WETH
    const mockProgram = new SwapVmProgram('0x01020304')

    describe('encodeSwapCallData', () => {
        it('should encode swap call with signature', () => {
            const order = {
                maker: mockMaker,
                traits: MakerTraits.default(),
                program: mockProgram
            }

            const takerTraits = TakerTraits.fromParams({
                isExactIn: true,
                threshold: 1000000n
            })

            const signature = new HexString('0x1234567890abcdef')
            const additionalData = new HexString('0xdeadbeef')

            const callData = SwapVMContract.encodeSwapCallData({
                order,
                tokenIn: mockTokenIn,
                tokenOut: mockTokenOut,
                amount: 100000n,
                signature,
                takerTraits,
                additionalData
            })

            expect(callData).toBeInstanceOf(HexString)
        })

        it('should encode swap call without signature (using Aqua)', () => {
            const order = {
                maker: mockMaker,
                traits: MakerTraits.fromParams({
                    useAquaInsteadOfSignature: true
                }),
                program: mockProgram
            }

            const takerTraits = TakerTraits.fromParams({
                isExactIn: true,
                threshold: 1000000n
            })

            const callData = SwapVMContract.encodeSwapCallData({
                order,
                tokenIn: mockTokenIn,
                tokenOut: mockTokenOut,
                amount: 100000n,
                takerTraits
            })

            expect(callData).toBeInstanceOf(HexString)
        })
    })

    describe('encodeQuoteCallData', () => {
        it('should encode quote call with takerTraits and data', () => {
            const order = {
                maker: mockMaker,
                traits: MakerTraits.default(),
                program: mockProgram
            }

            const takerTraits = TakerTraits.fromParams({
                isExactIn: true,
                shouldUnwrapWeth: true
            })

            const takerData = new HexString('0xcafebabe')

            const callData = SwapVMContract.encodeQuoteCallData({
                order,
                tokenIn: mockTokenIn,
                tokenOut: mockTokenOut,
                amount: 50000n,
                takerTraits,
                takerData
            })

            expect(callData).toBeInstanceOf(HexString)
        })
    })
})
