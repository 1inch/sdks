// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import type { DataFor } from '@1inch/sdk-core'
import { Address, HexString, Interaction, NetworkEnum } from '@1inch/sdk-core'
import { encodeAbiParameters, hashTypedData, keccak256 } from 'viem'

import { Order } from './order'
import { MakerTraits } from './maker-traits'
import { AquaProgramBuilder, RegularProgramBuilder, SwapVmProgram } from './programs'
import { getAquaSwapVmEip712Domain } from '../swap-vm-contract/constants'

function createMaker(): Address {
  return Address.fromBigInt(1n)
}

function createProgram(hex: string = '0x'): SwapVmProgram {
  return new SwapVmProgram(hex)
}

describe('Order', () => {
  describe('new', () => {
    const maker = createMaker()
    const receiver = Address.fromBigInt(2n)
    const program = createProgram('0x01')

    it.each<{ name: string; data: Partial<DataFor<MakerTraits>> }>([
      { name: 'Aqua defaults', data: {} },
      { name: 'Aqua with the maker as receiver', data: { customReceiver: maker } },
      {
        name: 'signature with shouldUnwrap',
        data: { useAquaInsteadOfSignature: false, shouldUnwrap: true },
      },
      {
        name: 'signature with custom receiver',
        data: { useAquaInsteadOfSignature: false, customReceiver: receiver },
      },
    ])('should create an order with $name traits', ({ data }) => {
      const traits = MakerTraits.default().with(data)

      expect(Order.new({ maker, traits, program })).toEqual(new Order(maker, traits, program))
    })

    it('should reject encoding Aqua traits with shouldUnwrap', () => {
      const traits = MakerTraits.default().with({ shouldUnwrap: true })
      const order = Order.new({ maker, traits, program })

      expect(() => order.encode()).toThrow('MakerTraitsUnwrapIsIncompatibleWithAqua')
    })

    it('should reject encoding Aqua traits with a receiver other than the maker', () => {
      const traits = MakerTraits.default().with({ customReceiver: receiver })
      const order = Order.new({ maker, traits, program })

      expect(() => order.encode()).toThrow('MakerTraitsCustomReceiverIsIncompatibleWithAqua')
    })

    it('should decode orders with Aqua-incompatible traits but reject re-encoding them', () => {
      const signed = MakerTraits.new({
        shouldUnwrap: true,
        useAquaInsteadOfSignature: false,
        allowZeroAmountIn: false,
        customReceiver: receiver,
      })
      const order = Order.new({ maker, traits: signed, program })
      const encoded = order.encode()
      const incompatible = Order.new({
        maker,
        traits: signed.withNew({ useAquaInsteadOfSignature: true }),
        program,
      })

      const decoded = Order.decode(encoded)

      expect(decoded.traits).toEqual(signed)
      expect(() => incompatible.encode()).toThrow('MakerTraitsUnwrapIsIncompatibleWithAqua')
      expect(() => incompatible.hash()).toThrow('MakerTraitsUnwrapIsIncompatibleWithAqua')
    })
  })

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
        useAquaInsteadOfSignature: false,
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

    it('should reject an order whose data ends inside a hook', () => {
      const maker = createMaker()
      const traits = MakerTraits.new({
        shouldUnwrap: false,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: false,
        preTransferInHook: new Interaction(Address.ZERO_ADDRESS, new HexString('0xaaaa')),
        postTransferInHook: new Interaction(Address.fromBigInt(2n), new HexString('0xbbbb')),
      })
      const { traits: encodedTraits, hooksData } = traits.encode(maker)
      const encoded = encodeAbiParameters(
        [Order.ABI],
        [
          {
            maker: maker.toString(),
            traits: encodedTraits,
            data: hooksData.sliceBytes(0, hooksData.bytesCount() - 1).toString(),
          },
        ],
      )

      expect(() => Order.decode(new HexString(encoded))).toThrow(
        'MakerTraitsMissingHookData: postTransferInHook data ends at byte 24, but only 23 bytes are provided',
      )
    })

    it('should reject an order whose program offset is beyond its data', () => {
      const traits = 10n << 208n
      const encoded = encodeAbiParameters(
        [Order.ABI],
        [{ maker: createMaker().toString(), traits, data: '0x1100' }],
      )

      expect(MakerTraits.hooksDataEndsAtByte(traits)).toBe(10)
      expect(() => Order.decode(new HexString(encoded))).toThrow(
        'Invalid hooks data offsets: hooks data ends at byte 10, but only 2 bytes are provided',
      )
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

    it('should decode an empty first hook without changing the encoding or hash', () => {
      const maker = new Address('0x3333333333333333333333333333333333333333')
      const encoded = new HexString(
        encodeAbiParameters(
          [Order.ABI],
          [
            {
              maker: maker.toString(),
              traits:
                39803530675328264941685581732473515572931709543860161877349024523970154594304n,
              data: '0xabcd1100',
            },
          ],
        ),
      )

      const decoded = Order.decode(encoded)

      expect(decoded.maker).toEqual(maker)
      expect(decoded.traits.preTransferInHook).toEqual(
        new Interaction(Address.ZERO_ADDRESS, HexString.EMPTY),
      )
      expect(decoded.traits.postTransferInHook).toEqual(
        new Interaction(Address.ZERO_ADDRESS, new HexString('0xabcd')),
      )
      expect(decoded.program).toEqual(createProgram('0x1100'))
      expect(decoded.encode().toString()).toBe(encoded.toString())
      expect(decoded.hash().toString()).toBe(keccak256(encoded.toString()))
      expect(decoded.hash().toString()).toBe(
        '0x536fc34685bd20b5869519e686e78046812055221533a98040024b1ae9291cca',
      )
    })

    it('should round-trip an order whose hooks are all empty', () => {
      const emptyHook = new Interaction(Address.ZERO_ADDRESS, HexString.EMPTY)
      const traits = MakerTraits.new({
        shouldUnwrap: false,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: false,
        preTransferInHook: emptyHook,
        postTransferInHook: emptyHook,
        preTransferOutHook: emptyHook,
        postTransferOutHook: emptyHook,
      })

      const original = new Order(createMaker(), traits, createProgram('0x1100'))
      const encoded = original.encode()
      const decoded = Order.decode(encoded)

      expect(decoded).toEqual(original)
      expect(decoded.encode().toString()).toBe(encoded.toString())
      expect(decoded.hash().toString()).toBe(original.hash().toString())
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

    it('should hash signature-based orders as EIP-712 Order(address maker,uint256 traits,bytes data)', () => {
      const traits = MakerTraits.new({
        useAquaInsteadOfSignature: false,
        allowZeroAmountIn: false,
        shouldUnwrap: true,
        customReceiver: Address.fromBigInt(2n),
        preTransferInHook: new Interaction(Address.fromBigInt(3n), new HexString('0xaabb')),
      })
      const order = new Order(createMaker(), traits, createProgram('0x01020304'))
      const { traits: packedTraits, data } = order.build()

      const expected = hashTypedData({
        domain: {
          chainId: 1,
          name: '1inch SwapVM v1.0',
          version: '1.0.2',
          verifyingContract: '0x111111338c5091e8440b67b168bae16a668ac0de',
        },
        primaryType: 'Order',
        types: {
          Order: [
            { name: 'maker', type: 'address' },
            { name: 'traits', type: 'uint256' },
            { name: 'data', type: 'bytes' },
          ],
        },
        message: { maker: createMaker().toString(), traits: packedTraits, data },
      })

      const domain = getAquaSwapVmEip712Domain(NetworkEnum.ETHEREUM)

      expect(order.hash(domain).toString()).toBe(expected)
      expect(order.hash({ ...domain, version: '1.0' }).toString()).not.toBe(expected)
    })

    it('should keep the Aqua hash after decode -> build of a program with a 32-byte salt', () => {
      // xycSwapXD -> salt(32 bytes)
      const program = createProgram('0x1100' + '1420' + 'ab'.repeat(32))
      const rebuilt = AquaProgramBuilder.decode(program).build()

      const original = new Order(createMaker(), MakerTraits.default(), program)
      const restored = new Order(createMaker(), MakerTraits.default(), rebuilt)

      expect(rebuilt.toString()).toBe(program.toString())
      expect(restored.hash().toString()).toBe(original.hash().toString())
    })

    it('should keep the EIP-712 hash after decode -> build of a program with a 32-byte salt', () => {
      const traits = MakerTraits.new({
        useAquaInsteadOfSignature: false,
        allowZeroAmountIn: false,
        shouldUnwrap: false,
      })
      const domain = {
        chainId: NetworkEnum.ETHEREUM,
        name: '1inch SwapVM v1.0',
        verifyingContract: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
        version: '1.0.2',
      }
      const program = new RegularProgramBuilder()
        .limitSwap1D({ makerDirectionLt: true })
        .salt({ bytes: new HexString('0x' + 'cd'.repeat(32)) })
        .build()
      const rebuilt = RegularProgramBuilder.decode(program).build()

      const original = new Order(createMaker(), traits, program)
      const restored = new Order(createMaker(), traits, rebuilt)

      expect(rebuilt.toString()).toBe(program.toString())
      expect(restored.hash(domain).toString()).toBe(original.hash(domain).toString())
    })
  })
})
