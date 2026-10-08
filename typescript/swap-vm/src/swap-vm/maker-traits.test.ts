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

  describe('decode validation', () => {
    const HAS_PRE_TRANSFER_IN_HOOK = 252n
    const HAS_POST_TRANSFER_IN_HOOK = 251n
    const PRE_TRANSFER_IN_HOOK_HAS_TARGET = 248n
    const POST_TRANSFER_IN_HOOK_HAS_TARGET = 247n

    function packTraits(flagBits: bigint[], offsets: [number, number, number, number]): bigint {
      const flags = flagBits.reduce((acc, bit) => acc | (1n << bit), 0n)

      return offsets.reduce(
        (acc, offset, i) => acc | (BigInt(offset) << (160n + 16n * BigInt(i))),
        flags,
      )
    }

    it('should decode valid encodings with absent hooks between present ones', () => {
      const maker = Address.fromBigInt(7n)
      const traits = MakerTraits.new({
        shouldUnwrap: false,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: false,
        preTransferInHook: new Interaction(Address.fromBigInt(20n), new HexString('0xaaaa')),
        postTransferOutHook: new Interaction(Address.ZERO_ADDRESS, new HexString('0xdddd')),
      })

      const { traits: encodedTraits, hooksData } = traits.encode(maker)
      const orderData = hooksData.concat(new HexString('0x1100'))

      expect(MakerTraits.decode(encodedTraits, hooksData)).toEqual(traits)
      expect(MakerTraits.decode(encodedTraits, orderData)).toEqual(traits)
    })

    it('should reject a flagged hook whose data ends beyond the provided data', () => {
      const traits = packTraits([HAS_PRE_TRANSFER_IN_HOOK], [500, 500, 500, 500])

      expect(() => MakerTraits.decode(traits, new HexString('0xabcd'))).toThrow(
        'MakerTraitsMissingHookData: preTransferInHook data ends at byte 500, but only 2 bytes are provided',
      )
    })

    it('should reject a flagged hook whose start offset is greater than its end offset', () => {
      const traits = packTraits([HAS_POST_TRANSFER_IN_HOOK], [4, 2, 4, 4])

      expect(() => MakerTraits.decode(traits, new HexString('0xabcdef01'))).toThrow(
        'Invalid postTransferInHook data offsets: start 4 is greater than end 2',
      )
    })

    it('should reject a hook with the target flag and fewer than 20 bytes of data', () => {
      const traits = packTraits(
        [HAS_POST_TRANSFER_IN_HOOK, POST_TRANSFER_IN_HOOK_HAS_TARGET],
        [0, 19, 19, 19],
      )

      expect(() => MakerTraits.decode(traits, new HexString(`0x${'11'.repeat(19)}`))).toThrow(
        'MakerTraitsMissingHookTarget: postTransferInHook has the target flag set, but its data is only 19 bytes long',
      )
    })

    it('should reject a first hook with the target flag and an empty data slice', () => {
      const traits = packTraits(
        [HAS_PRE_TRANSFER_IN_HOOK, PRE_TRANSFER_IN_HOOK_HAS_TARGET],
        [0, 0, 0, 0],
      )

      expect(() => MakerTraits.decode(traits, new HexString(`0x${'22'.repeat(20)}1100`))).toThrow(
        'MakerTraitsMissingHookTarget: preTransferInHook has the target flag set, but its data is only 0 bytes long',
      )
    })

    it('should reject a zero target when the target flag is set', () => {
      const traits = packTraits(
        [HAS_POST_TRANSFER_IN_HOOK, POST_TRANSFER_IN_HOOK_HAS_TARGET],
        [0, 22, 22, 22],
      )
      const hooksData = new HexString(`${Address.ZERO_ADDRESS.toString()}abcd`)

      expect(() => MakerTraits.decode(traits, hooksData)).toThrow(
        'Invalid postTransferInHook target: the target flag is set, but the target is the zero address',
      )
    })

    it('should reject hooks data that ends beyond the provided data', () => {
      const traits = packTraits([], [0, 0, 0, 10])

      expect(() => MakerTraits.decode(traits, new HexString('0x1100'))).toThrow(
        'Invalid hooks data offsets: hooks data ends at byte 10, but only 2 bytes are provided',
      )
    })
  })
})
