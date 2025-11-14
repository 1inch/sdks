import { describe, it, expect } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { MakerTraits } from './maker-traits'

describe('MakerTraits', () => {
  describe('default', () => {
    it('should create default traits with useAqua enabled by default', () => {
      const traits = MakerTraits.default()

      expect(traits.shouldUnwrapWeth()).toBe(false)
      expect(traits.isUseOfAquaInsteadOfSignatureEnabled()).toBe(true)
      expect(traits.allowsZeroAmountIn()).toBe(false)
      expect(traits.customReceiver()).toBe(null)
    })
  })

  describe('build', () => {
    it('should build traits with specified flags', () => {
      const receiver = Address.fromBigInt(1n)

      const traits = MakerTraits.fromParams({
        shouldUnwrapWeth: true,
        useAquaInsteadOfSignature: true,
        allowZeroAmountIn: true,
        receiver,
      })

      expect(traits.shouldUnwrapWeth()).toBe(true)
      expect(traits.isUseOfAquaInsteadOfSignatureEnabled()).toBe(true)
      expect(traits.allowsZeroAmountIn()).toBe(true)
      expect(traits.customReceiver()?.toString()).toBe(receiver.toString())
    })
  })

  describe('flags', () => {
    it('should set and unset shouldUnwrap flag', () => {
      const traits = MakerTraits.default()

      traits.withShouldUnwrap()
      expect(traits.shouldUnwrapWeth()).toBe(true)

      traits.disableUnwrap()
      expect(traits.shouldUnwrapWeth()).toBe(false)
    })


    it('should set and unset useAquaInsteadOfSignature flag', () => {
      const traits = MakerTraits.default()

      traits.enableUseOfAquaInsteadOfSignature()
      expect(traits.isUseOfAquaInsteadOfSignatureEnabled()).toBe(true)

      traits.disableUseAquaInsteadOfSignature()
      expect(traits.isUseOfAquaInsteadOfSignatureEnabled()).toBe(false)
    })

    it('should set and unset allowZeroAmountIn flag', () => {
      const traits = MakerTraits.default()

      traits.enableAllowZeroAmountIn()
      expect(traits.allowsZeroAmountIn()).toBe(true)
    })
  })


  describe('receiver', () => {
    it('should set and get receiver', () => {
      const traits = MakerTraits.default()
      const receiver = Address.fromBigInt(1n)

      traits.withCustomReceiver(receiver)
      expect(traits.customReceiver()?.toString()).toBe(receiver.toString())
    })
  })

  describe('conversion', () => {
    it('should convert to bigint', () => {
      const traits = MakerTraits.default().withShouldUnwrap()

      const bigintValue = traits.asBigInt()
      expect(typeof bigintValue).toBe('bigint')

      const traitsFromBigint = new MakerTraits(bigintValue)
      expect(traitsFromBigint.shouldUnwrapWeth()).toBe(true)
    })
  })
})
