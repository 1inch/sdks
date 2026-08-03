// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { decodeFunctionData } from 'viem'
import { Address, HexString } from '@1inch/sdk-core'
import { SwapVMContract } from './swap-vm-contract'
import type { SwapArgs } from './types'
import { MakerTraits, Order, TakerTraits } from '../swap-vm'
import { SwapVmProgram } from '../swap-vm/programs/swap-vm-program'
import { SWAP_VM_ABI } from '../abi/SwapVM.abi'

describe('SwapVMContract', () => {
  const mockMaker = new Address('0x1234567890123456789012345678901234567890')
  const mockTokenIn = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48') // USDC
  const mockTokenOut = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2') // WETH
  const mockContract = new Address('0x11111112542d85b3ef69ae05771c2dccff4faa26')
  const mockProgram = new SwapVmProgram('0x01020304')

  const buildOrder = (): Order =>
    Order.new({
      maker: mockMaker,
      traits: MakerTraits.default(),
      program: mockProgram,
    })

  const buildTakerTraits = (): TakerTraits =>
    TakerTraits.new({
      exactIn: true,
      threshold: 1000000n,
    })

  const swapArgs = (): SwapArgs => ({
    order: buildOrder(),
    tokenIn: mockTokenIn,
    tokenOut: mockTokenOut,
    amount: 100000n,
    takerTraits: buildTakerTraits(),
  })

  describe('encodeSwapCallData', () => {
    it('should encode swap call with signature', () => {
      const order = Order.new({
        maker: mockMaker,
        traits: MakerTraits.default(),
        program: mockProgram,
      })

      const takerTraits = TakerTraits.new({
        exactIn: true,
        threshold: 1000000n,
      })

      const callData = SwapVMContract.encodeSwapCallData({
        order,
        tokenIn: mockTokenIn,
        tokenOut: mockTokenOut,
        amount: 100000n,
        takerTraits,
      })

      expect(callData).toBeInstanceOf(HexString)
    })

    it('should encode swap call without signature (using Aqua)', () => {
      const order = Order.new({
        maker: mockMaker,
        traits: MakerTraits.default().with({
          useAquaInsteadOfSignature: true,
        }),
        program: mockProgram,
      })

      const takerTraits = TakerTraits.new({
        exactIn: true,
        threshold: 1000000n,
      })

      const callData = SwapVMContract.encodeSwapCallData({
        order,
        tokenIn: mockTokenIn,
        tokenOut: mockTokenOut,
        amount: 100000n,
        takerTraits,
      })

      expect(callData).toBeInstanceOf(HexString)
    })
  })

  describe('encodeQuoteCallData', () => {
    it('should encode quote call with takerTraits and data', () => {
      const order = Order.new({
        maker: mockMaker,
        traits: MakerTraits.default(),
        program: mockProgram,
      })

      const takerTraits = TakerTraits.new({
        exactIn: true,
        shouldUnwrap: true,
      })

      const callData = SwapVMContract.encodeQuoteCallData({
        order,
        tokenIn: mockTokenIn,
        tokenOut: mockTokenOut,
        amount: 50000n,
        takerTraits,
      })

      expect(callData).toBeInstanceOf(HexString)
    })

    it('should encode arguments that decode back to the original values', () => {
      const args = swapArgs()
      const callData = SwapVMContract.encodeQuoteCallData(args)

      const decoded = decodeFunctionData({
        abi: SWAP_VM_ABI,
        data: callData.toString(),
      })

      expect(decoded.functionName).toBe('quote')
      // viem decodes addresses checksummed, while `Address` normalises to lowercase.
      expect(String(decoded.args?.[1]).toLowerCase()).toBe(mockTokenIn.toString())
      expect(String(decoded.args?.[2]).toLowerCase()).toBe(mockTokenOut.toString())
      expect(decoded.args?.[3]).toBe(args.amount)
    })
  })

  describe('encodeHashOrderCallData', () => {
    it('should encode a hash call carrying the order tuple', () => {
      const order = buildOrder()
      const callData = SwapVMContract.encodeHashOrderCallData(order)

      expect(callData).toBeInstanceOf(HexString)

      const decoded = decodeFunctionData({
        abi: SWAP_VM_ABI,
        data: callData.toString(),
      })

      expect(decoded.functionName).toBe('hash')
      expect(decoded.args?.[0]).toMatchObject({ maker: mockMaker.toString() })
    })
  })

  describe('transaction builders', () => {
    it('buildSwapTx should target the contract with zero value', () => {
      const tx = SwapVMContract.buildSwapTx(mockContract, swapArgs())

      expect(tx.to).toBe(mockContract.toString())
      expect(tx.value).toBe(0n)
      expect(tx.data).toBe(SwapVMContract.encodeSwapCallData(swapArgs()).toString())
    })

    it('buildQuoteTx should target the contract with zero value', () => {
      const tx = SwapVMContract.buildQuoteTx(mockContract, swapArgs())

      expect(tx.to).toBe(mockContract.toString())
      expect(tx.value).toBe(0n)
      expect(tx.data).toBe(SwapVMContract.encodeQuoteCallData(swapArgs()).toString())
    })

    it('buildHashOrderTx should target the contract with zero value', () => {
      const tx = SwapVMContract.buildHashOrderTx(mockContract, buildOrder())

      expect(tx.to).toBe(mockContract.toString())
      expect(tx.value).toBe(0n)
      expect(tx.data).toBe(SwapVMContract.encodeHashOrderCallData(buildOrder()).toString())
    })

    it('quote and swap should produce different calldata for the same arguments', () => {
      const args = swapArgs()

      expect(SwapVMContract.buildQuoteTx(mockContract, args).data).not.toBe(
        SwapVMContract.buildSwapTx(mockContract, args).data,
      )
    })
  })

  describe('instance methods', () => {
    const contract = new SwapVMContract(mockContract)

    it('should expose the address it was constructed with', () => {
      expect(contract.address).toBe(mockContract)
    })

    it('swap should match the static builder bound to the instance address', () => {
      expect(contract.swap(swapArgs())).toEqual(
        SwapVMContract.buildSwapTx(mockContract, swapArgs()),
      )
    })

    it('quote should match the static builder bound to the instance address', () => {
      expect(contract.quote(swapArgs())).toEqual(
        SwapVMContract.buildQuoteTx(mockContract, swapArgs()),
      )
    })

    it('hashOrder should match the static builder bound to the instance address', () => {
      expect(contract.hashOrder(buildOrder())).toEqual(
        SwapVMContract.buildHashOrderTx(mockContract, buildOrder()),
      )
    })
  })
})
