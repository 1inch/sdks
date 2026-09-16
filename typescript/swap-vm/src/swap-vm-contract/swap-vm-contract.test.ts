// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, HexString, NetworkEnum } from '@1inch/sdk-core'
import { SwapVMContract } from './swap-vm-contract'
import { AQUA_SWAP_VM_CONTRACT_ADDRESSES } from './constants'
import { MakerTraits, Order, TakerTraits } from '../swap-vm'
import { SwapVmProgram } from '../swap-vm/programs/swap-vm-program'

describe('SwapVMContract', () => {
  const mockMaker = new Address('0x1234567890123456789012345678901234567890')
  const mockTokenIn = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48') // USDC
  const mockTokenOut = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2') // WETH
  const mockProgram = new SwapVmProgram('0x01020304')

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

      expect(callData.toString()).toMatch(/^0x[0-9a-f]+$/)
      expect(callData.toString().length).toBeGreaterThan(10)
    })
  })

  describe('hash and built transactions', () => {
    const order = Order.new({
      maker: mockMaker,
      traits: MakerTraits.default(),
      program: mockProgram,
    })
    const takerTraits = TakerTraits.new({
      exactIn: true,
      threshold: 1000000n,
    })
    const args = {
      order,
      tokenIn: mockTokenIn,
      tokenOut: mockTokenOut,
      amount: 100000n,
      takerTraits,
    }
    const contractAddress = new Address('0x111111338c5091e8440b67b168bae16a668ac0de')

    it('should encode hashOrder calldata', () => {
      const callData = SwapVMContract.encodeHashOrderCallData(order)

      expect(callData.toString()).toMatch(/^0x[0-9a-f]+$/)
      expect(callData.toString()).not.toBe(SwapVMContract.encodeSwapCallData(args).toString())
      expect(callData.toString()).not.toBe(SwapVMContract.encodeQuoteCallData(args).toString())
    })

    it('should build quote, swap and hash transactions', () => {
      const quoteTx = SwapVMContract.buildQuoteTx(contractAddress, args)
      const swapTx = SwapVMContract.buildSwapTx(contractAddress, args)
      const hashTx = SwapVMContract.buildHashOrderTx(contractAddress, order)

      expect(quoteTx.to).toBe(contractAddress.toString())
      expect(swapTx.to).toBe(contractAddress.toString())
      expect(hashTx.to).toBe(contractAddress.toString())
      expect(quoteTx.value).toBe(0n)
      expect(swapTx.value).toBe(0n)
      expect(hashTx.value).toBe(0n)
      expect(quoteTx.data).toBe(SwapVMContract.encodeQuoteCallData(args).toString())
      expect(swapTx.data).toBe(SwapVMContract.encodeSwapCallData(args).toString())
      expect(hashTx.data).toBe(SwapVMContract.encodeHashOrderCallData(order).toString())
    })

    it('should build transactions from an instance', () => {
      const contract = new SwapVMContract(contractAddress)

      expect(contract.quote(args)).toEqual(SwapVMContract.buildQuoteTx(contractAddress, args))
      expect(contract.swap(args)).toEqual(SwapVMContract.buildSwapTx(contractAddress, args))
      expect(contract.hashOrder(order)).toEqual(
        SwapVMContract.buildHashOrderTx(contractAddress, order),
      )
    })
  })

  it('should expose deployed Aqua SwapVM router addresses', () => {
    expect(AQUA_SWAP_VM_CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM].toString()).toBe(
      '0x111111338c5091e8440b67b168bae16a668ac0de',
    )
    expect(AQUA_SWAP_VM_CONTRACT_ADDRESSES[NetworkEnum.ARC].toString()).toBe(
      AQUA_SWAP_VM_CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM].toString(),
    )
  })
})
