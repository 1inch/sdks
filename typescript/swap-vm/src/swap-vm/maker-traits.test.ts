// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import type { DataFor } from '@1inch/sdk-core'
import { Address, HexString, Interaction } from '@1inch/sdk-core'
import { MakerTraits } from './maker-traits'

function encodeDecodeTest(traits: MakerTraits, maker?: Address): MakerTraits {
  const { traits: encodedTraits, hooksData } = traits.encode(maker)
  expect(typeof encodedTraits).toBe('bigint')

  const decoded = MakerTraits.decode(encodedTraits, hooksData)

  expect(decoded).toEqual(traits)

  return decoded
}

describe('MakerTraits', () => {
  describe('default', () => {
    it('should create default traits with useAqua enabled by default', () => {
      const traits = MakerTraits.default()

      expect(traits.shouldUnwrap).toBe(false)
      expect(traits.useAquaInsteadOfSignature).toBe(true)
      expect(traits.allowZeroAmountIn).toBe(false)
      expect(traits.customReceiver).toBeUndefined()
    })
  })

  describe('build', () => {
    it('should build traits with specified flags', () => {
      const receiver = Address.fromBigInt(1n)

      const traits = MakerTraits.new({
        shouldUnwrap: true,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: true,
        customReceiver: receiver,
      })

      expect(traits.shouldUnwrap).toBe(true)
      expect(traits.useAquaInsteadOfSignature).toBe(true)
      expect(traits.allowZeroAmountIn).toBe(true)
      expect(traits.customReceiver?.toString()).toBe(receiver.toString())
    })
  })

  describe('flags', () => {
    it('should set and unset shouldUnwrap flag', () => {
      const traits = MakerTraits.default()
      traits.with({ shouldUnwrap: true })
      expect(traits.shouldUnwrap).toBe(true)

      traits.with({ shouldUnwrap: false })
      expect(traits.shouldUnwrap).toBe(false)
    })

    it('should set and unset useAquaInsteadOfSignature flag', () => {
      const traits = MakerTraits.default()
      traits.with({ useAquaInsteadOfSignature: true })
      expect(traits.useAquaInsteadOfSignature).toBe(true)

      traits.with({ useAquaInsteadOfSignature: false })
      expect(traits.useAquaInsteadOfSignature).toBe(false)
    })

    it('should set and unset allowZeroAmountIn flag', () => {
      const traits = MakerTraits.default()

      traits.with({ allowZeroAmountIn: true })
      expect(traits.allowZeroAmountIn).toBe(true)

      traits.with({ allowZeroAmountIn: false })
      expect(traits.allowZeroAmountIn).toBe(false)
    })
  })

  describe('receiver', () => {
    it('should set and get receiver', () => {
      const traits = MakerTraits.default()
      const receiver = Address.fromBigInt(1n)

      traits.with({ customReceiver: receiver })
      expect(traits.customReceiver?.toString()).toBe(receiver.toString())
    })
  })

  describe('validate', () => {
    type Case = { name: string; data: Partial<DataFor<MakerTraits>>; maker?: Address }

    const maker = new Address('0x742d35cc6634c0532925a3b844bc454e4438f44e')
    const receiver = Address.fromBigInt(1n)
    const signature = { useAquaInsteadOfSignature: false }

    it.each<Case>([
      { name: 'Aqua defaults', data: {}, maker },
      { name: 'Aqua defaults without maker', data: {} },
      {
        name: 'Aqua with zero receiver without maker',
        data: { customReceiver: Address.ZERO_ADDRESS },
      },
      { name: 'Aqua with the maker as receiver', data: { customReceiver: maker }, maker },
      {
        name: 'Aqua with allowZeroAmountIn and hooks',
        data: {
          allowZeroAmountIn: true,
          preTransferInHook: new Interaction(Address.ZERO_ADDRESS, new HexString('0xaaaa')),
        },
        maker,
      },
      { name: 'signature with shouldUnwrap', data: { ...signature, shouldUnwrap: true }, maker },
      {
        name: 'signature with custom receiver',
        data: { ...signature, customReceiver: receiver },
        maker,
      },
      {
        name: 'signature with custom receiver without maker',
        data: { ...signature, customReceiver: receiver },
      },
      {
        name: 'signature with shouldUnwrap and custom receiver',
        data: { ...signature, shouldUnwrap: true, customReceiver: receiver },
        maker,
      },
    ])('should accept $name', ({ data, maker }) => {
      expect(() => MakerTraits.default().with(data).validate(maker)).not.toThrow()
    })

    it.each<Case & { error: string }>([
      {
        name: 'Aqua with shouldUnwrap',
        data: { shouldUnwrap: true },
        maker,
        error: 'MakerTraitsUnwrapIsIncompatibleWithAqua',
      },
      {
        name: 'Aqua with shouldUnwrap and the maker as receiver',
        data: { shouldUnwrap: true, customReceiver: maker },
        maker,
        error: 'MakerTraitsUnwrapIsIncompatibleWithAqua',
      },
      {
        name: 'Aqua with custom receiver',
        data: { customReceiver: receiver },
        maker,
        error: 'MakerTraitsCustomReceiverIsIncompatibleWithAqua',
      },
      {
        name: 'Aqua with custom receiver without maker',
        data: { customReceiver: receiver },
        error: 'MakerTraitsCustomReceiverIsIncompatibleWithAqua',
      },
      {
        name: 'Aqua with the maker as receiver without maker',
        data: { customReceiver: maker },
        error: 'MakerTraitsCustomReceiverIsIncompatibleWithAqua',
      },
    ])('should reject $name', ({ data, maker, error }) => {
      expect(() => MakerTraits.default().with(data).validate(maker)).toThrow(error)
    })

    it('should name the receiver and the maker in the error', () => {
      const traits = MakerTraits.default().with({ customReceiver: receiver })

      expect(() => traits.validate(maker)).toThrow(
        `MakerTraitsCustomReceiverIsIncompatibleWithAqua: customReceiver ${receiver} must be the maker (${maker}) for Aqua orders`,
      )
      expect(() => traits.validate()).toThrow(
        `customReceiver ${receiver} must be the maker (not provided) for Aqua orders`,
      )
    })

    it('should not be enforced when building, encoding or decoding traits', () => {
      const traits = MakerTraits.new({
        shouldUnwrap: true,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: false,
        customReceiver: receiver,
      })

      const decoded = encodeDecodeTest(traits, maker)

      expect(() => decoded.validate(maker)).toThrow('MakerTraitsUnwrapIsIncompatibleWithAqua')
    })
  })

  describe('conversion', () => {
    it('should convert to bigint and back without hooks', () => {
      const traits = MakerTraits.default().with({ shouldUnwrap: true, allowZeroAmountIn: true })

      encodeDecodeTest(traits)
    })

    it('should encode and decode traits with custom receiver', () => {
      const receiver = Address.fromBigInt(1n)

      const traits = MakerTraits.new({
        shouldUnwrap: true,
        useAquaInsteadOfSignature: false,
        allowZeroAmountIn: true,
        customReceiver: receiver,
      })

      encodeDecodeTest(traits)
    })

    it('should encode and decode traits with single hook without target', () => {
      const data = new HexString('0x1234')
      const hook = new Interaction(Address.ZERO_ADDRESS, data)

      const traits = MakerTraits.new({
        shouldUnwrap: false,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: false,
        preTransferInHook: hook,
      })

      encodeDecodeTest(traits)
    })

    it('should encode and decode traits with all hooks without targets', () => {
      const hook1 = new Interaction(Address.ZERO_ADDRESS, new HexString('0xaaaa'))
      const hook2 = new Interaction(Address.ZERO_ADDRESS, new HexString('0xbbbb'))
      const hook3 = new Interaction(Address.ZERO_ADDRESS, new HexString('0xcccc'))
      const hook4 = new Interaction(Address.ZERO_ADDRESS, new HexString('0xdddd'))

      const traits = MakerTraits.new({
        shouldUnwrap: true,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: false,
        preTransferInHook: hook1,
        postTransferInHook: hook2,
        preTransferOutHook: hook3,
        postTransferOutHook: hook4,
      })

      encodeDecodeTest(traits)
    })

    it('should encode and decode traits with hooks that have explicit targets', () => {
      const maker = Address.fromBigInt(5n)

      const hook1 = new Interaction(Address.fromBigInt(10n), new HexString('0xaaaa'))
      const hook2 = new Interaction(Address.fromBigInt(11n), new HexString('0xbbbb'))

      const traits = MakerTraits.new({
        shouldUnwrap: false,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: true,
        preTransferInHook: hook1,
        preTransferOutHook: hook2,
      })

      encodeDecodeTest(traits, maker)
    })

    it('should encode and decode traits with mixed hooks with and without targets', () => {
      const maker = Address.fromBigInt(7n)

      const preIn = new Interaction(Address.ZERO_ADDRESS, new HexString('0xaaaa'))
      const postIn = new Interaction(Address.fromBigInt(20n), new HexString('0xbbbb'))
      const preOut = new Interaction(Address.ZERO_ADDRESS, new HexString('0xcccc'))
      const postOut = new Interaction(Address.fromBigInt(21n), new HexString('0xdddd'))

      const traits = MakerTraits.new({
        shouldUnwrap: true,
        useAquaInsteadOfSignature: false,
        allowZeroAmountIn: true,
        preTransferInHook: preIn,
        postTransferInHook: postIn,
        preTransferOutHook: preOut,
        postTransferOutHook: postOut,
      })

      encodeDecodeTest(traits, maker)
    })
  })

  it('should encode hooks where target is maker', () => {
    const maker = new Address('0x742d35cc6634c0532925a3b844bc454e4438f44e')
    const traits = MakerTraits.new({
      shouldUnwrap: false,
      useAquaInsteadOfSignature: true,
      allowZeroAmountIn: false,
      preTransferInHook: new Interaction(maker, new HexString('0xdeadbeef01')),
      postTransferInHook: new Interaction(maker, new HexString('0xdeadbeef02')),
      preTransferOutHook: new Interaction(maker, new HexString('0xdeadbeef03')),
      postTransferOutHook: new Interaction(maker, new HexString('0xdeadbeef04')),
    })

    const encoded = traits.encode(maker)
    const decoded = MakerTraits.decode(encoded.traits, encoded.hooksData)

    expect(decoded.postTransferInHook?.data).toEqual(traits.postTransferInHook?.data)
    expect(decoded.postTransferInHook?.data).toEqual(traits.postTransferInHook?.data)
    expect(decoded.preTransferOutHook?.data).toEqual(traits.preTransferOutHook?.data)
    expect(decoded.postTransferOutHook?.data).toEqual(traits.postTransferOutHook?.data)

    // target is zero after decoding because target is same as maker
    expect(decoded.postTransferInHook?.target).toEqual(Address.ZERO_ADDRESS)
    expect(decoded.postTransferInHook?.target).toEqual(Address.ZERO_ADDRESS)
    expect(decoded.preTransferOutHook?.target).toEqual(Address.ZERO_ADDRESS)
    expect(decoded.postTransferOutHook?.target).toEqual(Address.ZERO_ADDRESS)
  })

  it('should encode hooks where target is not maker', () => {
    const maker = new Address('0x742d35cc6634c0532925a3b844bc454e4438f44e')
    const target = Address.fromBigInt(1n)
    const traits = MakerTraits.new({
      shouldUnwrap: false,
      useAquaInsteadOfSignature: true,
      allowZeroAmountIn: false,
      preTransferInHook: new Interaction(target, new HexString('0xdeadbeef01')),
      postTransferInHook: new Interaction(target, new HexString('0xdeadbeef02')),
      preTransferOutHook: new Interaction(target, new HexString('0xdeadbeef03')),
      postTransferOutHook: new Interaction(target, new HexString('0xdeadbeef04')),
    })

    const encoded = traits.encode(maker)
    const decoded = MakerTraits.decode(encoded.traits, encoded.hooksData)

    expect(decoded).toEqual(traits)
  })
})
