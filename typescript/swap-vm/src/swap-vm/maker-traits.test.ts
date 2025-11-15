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
})
