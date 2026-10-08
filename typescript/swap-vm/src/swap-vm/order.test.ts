// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, HexString, Interaction, NetworkEnum } from '@1inch/sdk-core'

import { Order } from './order'
import { MakerTraits } from './maker-traits'
import { SwapVmProgram } from './programs'

function createMaker(): Address {
  return Address.fromBigInt(1n)
}

function createProgram(hex: string = '0x'): SwapVmProgram {
  return new SwapVmProgram(hex)
}

describe('Order', () => {
  describe('encode / decode', () => {
    it('should round-trip encode/decode without hooks', () => {
      const maker = createMaker()
      const traits = MakerTraits.default()
      const program = createProgram('0x01')

      const original = new Order(maker, traits, program)
      const encoded = original.encode()
      const decoded = Order.decode(encoded)

      expect(decoded).toEqual(original)
    })

    it('should round-trip encode/decode with hooks and program', () => {
      const maker = createMaker()

      const preIn = new Interaction(Address.ZERO_ADDRESS, new HexString('0xaaaa'))
      const postIn = new Interaction(Address.fromBigInt(2n), new HexString('0xbbbb'))
      const preOut = new Interaction(Address.ZERO_ADDRESS, new HexString('0xcccc'))
      const postOut = new Interaction(Address.fromBigInt(3n), new HexString('0xdddd'))

      const traits = MakerTraits.new({
        shouldUnwrap: true,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: true,
        preTransferInHook: preIn,
        postTransferInHook: postIn,
        preTransferOutHook: preOut,
        postTransferOutHook: postOut,
      })

      const programBytes = '0xfeedface'
      const program = createProgram(programBytes)

      const original = new Order(maker, traits, program)
      const encoded = original.encode()
      const decoded = Order.decode(encoded)

      expect(decoded).toEqual(original)
    })

    it('should correctly strip hooksData when recovering program on decode', () => {
      const maker = createMaker()

      const hook = new Interaction(Address.ZERO_ADDRESS, new HexString('0xabcdef'))
      const traits = MakerTraits.new({
        shouldUnwrap: false,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: false,
        preTransferInHook: hook,
      })

      const programBytes = '0x1122334455'
      const program = createProgram(programBytes)

      const original = new Order(maker, traits, program)
      const encoded = original.encode()
      const decoded = Order.decode(encoded)

      expect(decoded).toEqual(original)
    })

    it('should round-trip hooks with empty data without changing the encoding or hash', () => {
      const maker = new Address('0x3333333333333333333333333333333333333333')
      const target = new Address('0x4444444444444444444444444444444444444444')

      const traits = MakerTraits.new({
        shouldUnwrap: false,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: false,
        preTransferInHook: new Interaction(Address.ZERO_ADDRESS, new HexString('0xaaaa')),
        postTransferInHook: new Interaction(Address.ZERO_ADDRESS, HexString.EMPTY),
        preTransferOutHook: new Interaction(target, HexString.EMPTY),
        postTransferOutHook: new Interaction(Address.ZERO_ADDRESS, new HexString('0xdddd')),
      })

      const original = new Order(maker, traits, createProgram('0x1100'))
      const encoded = original.encode()
      const decoded = Order.decode(encoded)

      expect(decoded).toEqual(original)
      expect(decoded.build().data).toBe('0xaaaa4444444444444444444444444444444444444444dddd1100')
      expect(decoded.encode().toString()).toBe(encoded.toString())
      expect(decoded.hash().toString()).toBe(original.hash().toString())
      expect(decoded.hash().toString()).toBe(
        '0xb2a0df79e94ea67a344251b1387fbc98fc3bb635db7dcc0b9876fc2c4aa07985',
      )
    })
  })

  describe('hash', () => {
    it('should hash with keccak when using Aqua instead of signature', () => {
      const order = new Order(createMaker(), MakerTraits.default(), createProgram('0x01'))
      const hash = order.hash()

      expect(hash.toString()).toMatch(/^0x[0-9a-f]{64}$/)
    })

    it('should require a domain and produce an EIP-712 hash when Aqua is disabled', () => {
      const traits = MakerTraits.new({
        useAquaInsteadOfSignature: false,
        allowZeroAmountIn: false,
        shouldUnwrap: false,
      })
      const order = new Order(createMaker(), traits, createProgram('0x01'))

      expect(() => order.hash()).toThrow('domain info required')

      const hash = order.hash({
        chainId: NetworkEnum.ETHEREUM,
        name: '1inch SwapVM v1.0',
        verifyingContract: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
        version: '1.0.2',
      })

      expect(hash.toString()).toMatch(/^0x[0-9a-f]{64}$/)
      expect(hash.toString()).not.toBe(
        new Order(createMaker(), MakerTraits.default(), createProgram('0x01')).hash().toString(),
      )
    })
  })
})
