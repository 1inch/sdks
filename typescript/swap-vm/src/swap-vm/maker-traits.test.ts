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

      traits.with({ customReceiver: undefined })
      expect(traits.customReceiver).toBeUndefined()
      expect(() => traits.encode()).not.toThrow()
    })
  })

  describe('with', () => {
    it('should mutate the receiver in place and return it', () => {
      const base = MakerTraits.new({ shouldUnwrap: false, allowZeroAmountIn: false })
      const same = base.with({ shouldUnwrap: true, allowZeroAmountIn: true })

      expect(same).toBe(base)
      expect(base.shouldUnwrap).toBe(true)
      expect(base.allowZeroAmountIn).toBe(true)
    })
  })

  describe('withNew', () => {
    const receiverA = Address.fromBigInt(0xaaaan)
    const receiverB = Address.fromBigInt(0xbbbbn)

    it('should return a new instance and leave the original unchanged', () => {
      const base = MakerTraits.new({
        shouldUnwrap: false,
        customReceiver: receiverA,
        allowZeroAmountIn: true,
      })
      const baseEncoded = base.encode().traits

      const derived = base.withNew({ shouldUnwrap: true, customReceiver: receiverB })

      expect(derived).toBeInstanceOf(MakerTraits)
      expect(derived).not.toBe(base)
      expect(derived.shouldUnwrap).toBe(true)
      expect(derived.customReceiver?.equal(receiverB)).toBe(true)
      expect(derived.allowZeroAmountIn).toBe(true)

      expect(base.shouldUnwrap).toBe(false)
      expect(base.customReceiver?.equal(receiverA)).toBe(true)
      expect(base.encode().traits).toBe(baseEncoded)
    })

    it('should reset keys set to undefined to canonical defaults', () => {
      const hook = new Interaction(Address.ZERO_ADDRESS, new HexString('0x1234'))
      const base = MakerTraits.new({
        shouldUnwrap: true,
        useAquaInsteadOfSignature: false,
        customReceiver: receiverA,
        preTransferInHook: hook,
      })

      const updated = base.withNew({
        shouldUnwrap: undefined,
        useAquaInsteadOfSignature: undefined,
        customReceiver: undefined,
        preTransferInHook: undefined,
        allowZeroAmountIn: true,
      })

      expect(updated.shouldUnwrap).toBe(false)
      expect(updated.useAquaInsteadOfSignature).toBe(true)
      expect(updated.customReceiver).toBeUndefined()
      expect(updated.preTransferInHook).toBeUndefined()
      expect(updated.allowZeroAmountIn).toBe(true)
      encodeDecodeTest(updated)
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

    it('should reject encoding incompatible Aqua traits but still allow decoding them', () => {
      const signed = MakerTraits.new({
        shouldUnwrap: true,
        useAquaInsteadOfSignature: false,
        allowZeroAmountIn: false,
        customReceiver: receiver,
      })
      const { traits: encodedTraits, hooksData } = signed.encode(maker)
      const decoded = MakerTraits.decode(encodedTraits, hooksData).with({
        useAquaInsteadOfSignature: true,
      })

      expect(() => decoded.encode(maker)).toThrow('MakerTraitsUnwrapIsIncompatibleWithAqua')
      expect(() => decoded.validate(maker)).toThrow('MakerTraitsUnwrapIsIncompatibleWithAqua')
    })
  })

  describe('conversion', () => {
    it('should convert to bigint and back without hooks', () => {
      const traits = MakerTraits.default().with({
        useAquaInsteadOfSignature: false,
        shouldUnwrap: true,
        allowZeroAmountIn: true,
      })

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
        useAquaInsteadOfSignature: false,
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

    it('should decode hook targets regardless of hex letter case', () => {
      const maker = Address.fromBigInt(7n)

      const traits = MakerTraits.new({
        shouldUnwrap: false,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: false,
        preTransferInHook: new Interaction(
          new Address(`0x${'ab'.repeat(20)}`),
          new HexString('0x1234'),
        ),
        postTransferInHook: new Interaction(Address.ZERO_ADDRESS, new HexString('0x5678')),
        postTransferOutHook: new Interaction(
          new Address('0x7a250d5630b4cf539739df2c5dacb4c659f2488d'),
          new HexString('0x90'),
        ),
      })

      const { traits: encodedTraits, hooksData } = traits.encode(maker)
      const upperCaseHooksData = new HexString(`0x${hooksData.toString().slice(2).toUpperCase()}`)

      expect(upperCaseHooksData.equal(hooksData)).toBe(false)

      const decoded = MakerTraits.decode(encodedTraits, upperCaseHooksData)

      expect(decoded).toEqual(MakerTraits.decode(encodedTraits, hooksData))
      expect(decoded).toEqual(traits)
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
