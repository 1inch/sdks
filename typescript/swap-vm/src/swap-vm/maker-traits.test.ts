// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
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

    it('should encode and decode hooks with empty data after a non-empty first hook', () => {
      const maker = Address.fromBigInt(7n)
      const target = Address.fromBigInt(30n)

      const traits = MakerTraits.new({
        shouldUnwrap: false,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: false,
        preTransferInHook: new Interaction(Address.ZERO_ADDRESS, new HexString('0xaaaa')),
        postTransferInHook: new Interaction(Address.ZERO_ADDRESS, HexString.EMPTY),
        preTransferOutHook: new Interaction(Address.ZERO_ADDRESS, HexString.EMPTY),
        postTransferOutHook: new Interaction(target, HexString.EMPTY),
      })

      const { hooksData } = traits.encode(maker)

      expect(hooksData.toString()).toBe(`0xaaaa${target.toString().slice(2)}`)

      const decoded = encodeDecodeTest(traits, maker)

      expect(decoded.postTransferInHook?.data.isEmpty()).toBe(true)
      expect(decoded.preTransferOutHook?.data.isEmpty()).toBe(true)
      expect(decoded.postTransferOutHook?.target).toEqual(target)
      expect(decoded.postTransferOutHook?.data.isEmpty()).toBe(true)
    })

    it('should match MakerTraitsLib.build output for hooks with empty data', () => {
      const maker = new Address('0x3333333333333333333333333333333333333333')
      const target = new Address('0x4444444444444444444444444444444444444444')
      const onChainTraits =
        42630485978982730269626159077550656080137343507199255245084254063879318929408n
      const onChainHooksData = new HexString('0xaaaa4444444444444444444444444444444444444444dddd')
      const program = new HexString('0x1100')

      const traits = MakerTraits.new({
        shouldUnwrap: false,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: false,
        preTransferInHook: new Interaction(Address.ZERO_ADDRESS, new HexString('0xaaaa')),
        postTransferInHook: new Interaction(Address.ZERO_ADDRESS, HexString.EMPTY),
        preTransferOutHook: new Interaction(target, HexString.EMPTY),
        postTransferOutHook: new Interaction(Address.ZERO_ADDRESS, new HexString('0xdddd')),
      })

      expect(traits.encode(maker)).toEqual({ traits: onChainTraits, hooksData: onChainHooksData })
      expect(MakerTraits.decode(onChainTraits, onChainHooksData.concat(program))).toEqual(traits)
      expect(MakerTraits.hooksDataEndsAtByte(onChainTraits)).toBe(onChainHooksData.bytesCount())
    })

    it('should decode an empty first hook from MakerTraitsLib.build output', () => {
      const maker = new Address('0x3333333333333333333333333333333333333333')
      const onChainTraits =
        39803530675328264941685581732473515572931709543860161877349024523970154594304n
      const onChainData = new HexString('0xabcd1100')

      const decoded = MakerTraits.decode(onChainTraits, onChainData)

      expect(decoded).toEqual(
        MakerTraits.new({
          shouldUnwrap: false,
          useAquaInsteadOfSignature: true,
          allowZeroAmountIn: false,
          preTransferInHook: new Interaction(Address.ZERO_ADDRESS, HexString.EMPTY),
          postTransferInHook: new Interaction(Address.ZERO_ADDRESS, new HexString('0xabcd')),
        }),
      )
      expect(onChainData.sliceBytes(MakerTraits.hooksDataEndsAtByte(onChainTraits))).toEqual(
        new HexString('0x1100'),
      )
      expect(decoded.encode(maker)).toEqual({
        traits: onChainTraits,
        hooksData: new HexString('0xabcd'),
      })
    })

    it('should decode empty hooks as empty data when the program follows the hooks data', () => {
      const traits = MakerTraits.new({
        shouldUnwrap: false,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: false,
        preTransferInHook: new Interaction(Address.ZERO_ADDRESS, HexString.EMPTY),
        postTransferInHook: new Interaction(Address.ZERO_ADDRESS, HexString.EMPTY),
        preTransferOutHook: new Interaction(Address.ZERO_ADDRESS, HexString.EMPTY),
        postTransferOutHook: new Interaction(Address.ZERO_ADDRESS, HexString.EMPTY),
      })

      const { traits: encodedTraits, hooksData } = traits.encode()
      const orderData = hooksData.concat(new HexString('0x1100'))

      expect(hooksData.isEmpty()).toBe(true)
      expect(MakerTraits.decode(encodedTraits, orderData)).toEqual(traits)
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
