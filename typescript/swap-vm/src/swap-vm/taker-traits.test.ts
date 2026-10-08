// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { UINT_256_MAX, UINT_40_MAX } from '@1inch/byte-utils'
import { Address, HexString } from '@1inch/sdk-core'
import { TakerTraits } from './taker-traits'

describe('TakerTraits', () => {
  const mockReceiver = Address.fromBigInt(2n)

  describe('default', () => {
    it('should create default traits with all flags off', () => {
      const traits = TakerTraits.default()

      expect(traits.exactIn).toBe(true)
      expect(traits.shouldUnwrap).toBe(false)
      expect(traits.preTransferInCallbackEnabled).toBe(false)
      expect(traits.strictThreshold).toBe(false)
      expect(!traits.threshold || traits.threshold === 0n).toBe(true)
      expect(!traits.customReceiver || traits.customReceiver.isZero()).toBe(true)
      expect(traits.firstTransferFromTaker).toBe(false)
      expect(traits.useTransferFromAndAquaPush).toBe(true)
      expect(traits.threshold).toBe(0n)
      expect(traits.customReceiver?.toString()).toBe(Address.ZERO_ADDRESS.toString())
    })
  })

  describe('fromParams', () => {
    it('should build traits with specified flags', () => {
      const threshold = 1000000n
      const traits = TakerTraits.new({
        exactIn: true,
        shouldUnwrap: true,
        preTransferInCallbackEnabled: false,
        strictThreshold: true,
        firstTransferFromTaker: true,
        useTransferFromAndAquaPush: false,
        threshold,
        customReceiver: mockReceiver,
      })

      expect(traits.exactIn).toBe(true)
      expect(traits.shouldUnwrap).toBe(true)
      expect(traits.preTransferInCallbackEnabled).toBe(false)
      expect(traits.strictThreshold).toBe(true)
      expect(traits.firstTransferFromTaker).toBe(true)
      expect(traits.useTransferFromAndAquaPush).toBe(false)
      expect(traits.threshold !== undefined && traits.threshold > 0n).toBe(true)
      expect(traits.threshold).toBe(threshold)
      expect(traits.customReceiver !== undefined && !traits.customReceiver.isZero()).toBe(true)
      expect(traits.customReceiver?.toString()).toBe(mockReceiver.toString())
    })
  })

  describe('flags', () => {
    it('should set and unset exactIn flag', () => {
      const traits = TakerTraits.default()

      const exactIn = traits.with({ exactIn: true })
      expect(exactIn.exactIn).toBe(true)

      const exactOut = traits.with({ exactIn: false })
      expect(exactOut.exactIn).toBe(false)
    })

    it('should set and unset shouldUnwrap flag', () => {
      const traits = TakerTraits.default()

      const withUnwrap = traits.with({ shouldUnwrap: true })
      expect(withUnwrap.shouldUnwrap).toBe(true)

      const withoutUnwrap = traits.with({ shouldUnwrap: false })
      expect(withoutUnwrap.shouldUnwrap).toBe(false)
    })

    it('should set and unset preTransferIn hook flag', () => {
      const traits = TakerTraits.default()

      const withHook = traits.with({ preTransferInCallbackEnabled: true })
      expect(withHook.preTransferInCallbackEnabled).toBe(true)

      const withoutHook = traits.with({ preTransferInCallbackEnabled: false })
      expect(withoutHook.preTransferInCallbackEnabled).toBe(false)
    })

    it('should set and unset strict threshold flag', () => {
      const traits = TakerTraits.default()

      const strict = traits.with({ strictThreshold: true })
      expect(strict.strictThreshold).toBe(true)

      const notStrict = traits.with({ strictThreshold: false })
      expect(notStrict.strictThreshold).toBe(false)
    })

    it('should set and unset firstTransferFromTaker flag', () => {
      const traits = TakerTraits.default()

      const firstFromTaker = traits.with({ firstTransferFromTaker: true })
      expect(firstFromTaker.firstTransferFromTaker).toBe(true)

      const notFirstFromTaker = traits.with({ firstTransferFromTaker: false })
      expect(notFirstFromTaker.firstTransferFromTaker).toBe(false)
    })

    it('should set and unset transferFromAndAquaPush flag', () => {
      const traits = TakerTraits.default()

      const withAqua = traits.with({ useTransferFromAndAquaPush: true })
      expect(withAqua.useTransferFromAndAquaPush).toBe(true)

      const withoutAqua = traits.with({ useTransferFromAndAquaPush: false })
      expect(withoutAqua.useTransferFromAndAquaPush).toBe(false)
    })
  })

  describe('threshold', () => {
    it('should set and get threshold', () => {
      const traits = TakerTraits.default()
      const threshold = 1000000n

      const withThreshold = traits.with({ threshold })
      expect(withThreshold.threshold !== undefined && withThreshold.threshold > 0n).toBe(true)
      expect(withThreshold.threshold).toBe(threshold)

      const withoutThreshold = withThreshold.with({ threshold: undefined })
      expect(!withoutThreshold.threshold || withoutThreshold.threshold === 0n).toBe(true)
      expect(withoutThreshold.threshold).toBe(undefined)
    })
  })

  describe('receiver', () => {
    it('should set and get receiver', () => {
      const traits = TakerTraits.default()

      const withReceiver = traits.with({ customReceiver: mockReceiver })
      expect(
        withReceiver.customReceiver !== undefined && !withReceiver.customReceiver.isZero(),
      ).toBe(true)
      expect(withReceiver.customReceiver?.toString()).toBe(mockReceiver.toString())

      const withoutReceiver = withReceiver.with({ customReceiver: undefined })
      expect(!withoutReceiver.customReceiver || withoutReceiver.customReceiver.isZero()).toBe(true)
      expect(withoutReceiver.customReceiver).toBe(undefined)
    })
  })

  describe('encode/decode', () => {
    it('should encode and decode traits with threshold and receiver', () => {
      const threshold = 1000000n
      const originalTraits = TakerTraits.new({
        exactIn: true,
        shouldUnwrap: true,
        threshold,
        customReceiver: mockReceiver,
      })

      const encoded = originalTraits.encode()
      expect(encoded).toBeInstanceOf(HexString)

      const decoded = TakerTraits.decode(encoded)

      expect(decoded.exactIn).toBe(true)
      expect(decoded.shouldUnwrap).toBe(true)
      expect(decoded.threshold).toBe(threshold)
      expect(decoded.customReceiver?.toString()).toBe(mockReceiver.toString())
    })

    it('should encode and decode traits without optional fields', () => {
      const originalTraits = TakerTraits.new({
        exactIn: true,
        preTransferInCallbackEnabled: true,
        preTransferInCallbackData: new HexString('0xdeadbeef'),
      })

      const encoded = originalTraits.encode()
      const decoded = TakerTraits.decode(encoded)

      expect(decoded.exactIn).toBe(true)
      expect(decoded.preTransferInCallbackEnabled).toBe(true)
      expect(decoded.preTransferInCallbackData.toString()).toBe('0xdeadbeef')
      expect(!decoded.threshold || decoded.threshold === 0n).toBe(true)
      expect(!decoded.deadline || decoded.deadline === 0n).toBe(true)
      expect(!decoded.customReceiver || decoded.customReceiver.isZero()).toBe(true)
      expect(decoded.customReceiver?.isZero()).toBe(true)
    })

    it('should encode and decode traits with deadline (main-branch format)', () => {
      const deadline = 1735689600n
      const originalTraits = TakerTraits.new({
        exactIn: true,
        deadline,
      })

      const encoded = originalTraits.encode()
      const decoded = TakerTraits.decode(encoded)

      expect(decoded.deadline).toBe(deadline)
      expect(decoded.exactIn).toBe(true)
    })
  })

  describe('value ranges', () => {
    const sectionEnds = (encoded: HexString): number[] =>
      Array.from({ length: 10 }, (_, i) =>
        Number(encoded.sliceBytes(i * 2, i * 2 + 2).toBigInt()),
      ).reverse()

    const construct = (threshold: bigint, deadline: bigint): TakerTraits =>
      new TakerTraits(
        true,
        false,
        false,
        false,
        false,
        false,
        true,
        threshold,
        Address.ZERO_ADDRESS,
        deadline,
      )

    it('should encode the max threshold as a 32-byte section that round-trips', () => {
      const encoded = TakerTraits.new({ threshold: UINT_256_MAX }).encode()

      expect(encoded.toString()).toBe(
        '0x00200020002000200020002000200020002000200041' + 'ff'.repeat(32),
      )
      expect(sectionEnds(encoded)[0]).toBe(32)

      const decoded = TakerTraits.decode(encoded)
      expect(decoded.threshold).toBe(UINT_256_MAX)
      expect(decoded.encode().toString()).toBe(encoded.toString())
    })

    it('should encode the max deadline as a 5-byte section that round-trips', () => {
      const encoded = TakerTraits.new({ deadline: UINT_40_MAX }).encode()

      expect(encoded.toString()).toBe(
        '0x00050005000500050005000500050005000000000041' + 'ff'.repeat(5),
      )
      const [thresholdEnd, toEnd, deadlineEnd] = sectionEnds(encoded)
      expect(thresholdEnd).toBe(0)
      expect(deadlineEnd - toEnd).toBe(5)

      const decoded = TakerTraits.decode(encoded)
      expect(decoded.deadline).toBe(UINT_40_MAX)
      expect(decoded.encode().toString()).toBe(encoded.toString())
    })

    it('should match TakerTraitsLib.build output for max threshold and deadline', () => {
      const encoded = TakerTraits.new({ threshold: UINT_256_MAX, deadline: UINT_40_MAX }).encode()

      expect(encoded.toString()).toBe(
        '0x00250025002500250025002500250025002000200041' + 'ff'.repeat(37),
      )

      const decoded = TakerTraits.decode(encoded)
      expect(decoded.threshold).toBe(UINT_256_MAX)
      expect(decoded.deadline).toBe(UINT_40_MAX)
    })

    it('should accept boundary values via constructor, new() and with()', () => {
      for (const [threshold, deadline] of [
        [0n, 0n],
        [UINT_256_MAX, UINT_40_MAX],
      ]) {
        expect(construct(threshold, deadline).threshold).toBe(threshold)
        expect(TakerTraits.new({ threshold, deadline }).deadline).toBe(deadline)

        const updated = TakerTraits.default().with({ threshold, deadline })
        expect(updated.threshold).toBe(threshold)
        expect(updated.deadline).toBe(deadline)
      }
    })

    it.each([
      { label: '-1', threshold: -1n },
      { label: 'UINT_256_MAX + 1', threshold: UINT_256_MAX + 1n },
      { label: '2^264 - 1', threshold: 2n ** 264n - 1n },
    ])('should reject threshold $label via constructor, new() and with()', ({ threshold }) => {
      const message = `Invalid threshold: ${threshold}. Must be >= 0 and <= UINT_256_MAX`

      expect(() => construct(threshold, 0n)).toThrow(message)
      expect(() => TakerTraits.new({ threshold })).toThrow(message)
      expect(() => TakerTraits.default().with({ threshold })).toThrow(message)
    })

    it.each([
      { label: '-1', deadline: -1n },
      { label: 'UINT_40_MAX + 1', deadline: UINT_40_MAX + 1n },
      { label: '2^44', deadline: 2n ** 44n },
    ])('should reject deadline $label via constructor, new() and with()', ({ deadline }) => {
      const message = `Invalid deadline: ${deadline}. Must be >= 0 and <= UINT_40_MAX`

      expect(() => construct(0n, deadline)).toThrow(message)
      expect(() => TakerTraits.new({ deadline })).toThrow(message)
      expect(() => TakerTraits.default().with({ deadline })).toThrow(message)
    })

    it('should leave the instance unchanged when with() rejects a value', () => {
      const traits = TakerTraits.new({ threshold: 1000n, deadline: 1735689600n })
      const encoded = traits.encode().toString()

      expect(() => traits.with({ exactIn: false, threshold: -1n })).toThrow('Invalid threshold')
      expect(() => traits.with({ exactIn: false, deadline: UINT_40_MAX + 1n })).toThrow(
        'Invalid deadline',
      )

      expect(traits.exactIn).toBe(true)
      expect(traits.threshold).toBe(1000n)
      expect(traits.deadline).toBe(1735689600n)
      expect(traits.encode().toString()).toBe(encoded)
    })
  })

  describe('validate', () => {
    it('should validate exact input with minimum output threshold', () => {
      const threshold = 1000n
      const traits = TakerTraits.new({
        exactIn: true,
        threshold,
      })

      expect(() => traits.validate(500n, 1000n)).not.toThrow()
      expect(() => traits.validate(500n, 1500n)).not.toThrow()

      expect(() => traits.validate(500n, 999n)).toThrow(
        'TakerTraitsInsufficientMinOutputAmount: amountOut 999 < threshold 1000',
      )
    })

    it('should validate exact output with maximum input threshold', () => {
      const threshold = 1000n
      const traits = TakerTraits.new({
        threshold,
      })

      // by default exact in is a true, so we need to switch to exact out
      const exactOutTraits = traits.with({ exactIn: false })

      expect(() => exactOutTraits.validate(1000n, 500n)).not.toThrow()
      expect(() => exactOutTraits.validate(900n, 500n)).not.toThrow()

      expect(() => exactOutTraits.validate(1001n, 500n)).toThrow(
        'TakerTraitsExceedingMaxInputAmount: amountIn 1001 > threshold 1000',
      )
    })

    it('should validate strict threshold amount', () => {
      const threshold = 1000n
      const traits = TakerTraits.new({
        strictThreshold: true,
        threshold,
      })

      expect(() => traits.validate(500n, 1000n)).not.toThrow()

      expect(() => traits.validate(500n, 999n)).toThrow(
        'TakerTraitsNonExactThresholdAmount: amountOut 999 != threshold 1000',
      )
      expect(() => traits.validate(500n, 1001n)).toThrow(
        'TakerTraitsNonExactThresholdAmount: amountOut 1001 != threshold 1000',
      )
    })

    it('should not validate when no threshold is set', () => {
      const traits = TakerTraits.new({
        exactIn: true,
      })

      expect(() => traits.validate(1000n, 500n)).not.toThrow()
      expect(() => traits.validate(1n, 1n)).not.toThrow()
    })
  })

  describe('Smart Contract Data Verification', () => {
    it('should correctly encode/decode with real contract pattern - partial fill', () => {
      const threshold = BigInt('25000000000000000000')
      const traits = TakerTraits.new({
        exactIn: true,
        shouldUnwrap: false,
        strictThreshold: false,
        firstTransferFromTaker: true,
        useTransferFromAndAquaPush: false,
        threshold: threshold,
        customReceiver: Address.ZERO_ADDRESS,
        preTransferInCallbackEnabled: false,
        preTransferOutCallbackEnabled: false,
        signature: new HexString(
          '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d' +
            '4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c1b',
        ),
      })

      const encoded = traits.encode()
      const decoded = TakerTraits.decode(encoded)

      expect(decoded.exactIn).toBe(true)
      expect(decoded.shouldUnwrap).toBe(false)
      expect(decoded.strictThreshold).toBe(false)
      expect(decoded.firstTransferFromTaker).toBe(true)
      expect(decoded.useTransferFromAndAquaPush).toBe(false)
      expect(decoded.threshold).toBe(threshold)
      expect(decoded.customReceiver.isZero()).toBe(true)
      expect(decoded.preTransferInCallbackEnabled).toBe(false)
      expect(decoded.preTransferOutCallbackEnabled).toBe(false)
      expect(decoded.signature.toString()).toBe(
        '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d' +
          '4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c1b',
      )
    })

    it('should correctly encode/decode with Aqua callback pattern', () => {
      const threshold = BigInt('20000000000000000000')
      const traits = TakerTraits.new({
        exactIn: true,
        shouldUnwrap: false,
        strictThreshold: false,
        firstTransferFromTaker: false,
        useTransferFromAndAquaPush: false,
        threshold: threshold,
        customReceiver: Address.ZERO_ADDRESS,
        preTransferInCallbackEnabled: true,
        preTransferOutCallbackEnabled: false,
        preTransferInCallbackData: new HexString('0xabcdef'),
        signature: HexString.EMPTY,
      })

      const encoded = traits.encode()
      const decoded = TakerTraits.decode(encoded)

      expect(decoded.exactIn).toBe(true)
      expect(decoded.firstTransferFromTaker).toBe(false)
      expect(decoded.threshold).toBe(threshold)
      expect(decoded.preTransferInCallbackEnabled).toBe(true)
      expect(decoded.preTransferInCallbackData.toString()).toBe('0xabcdef')
      expect(decoded.signature.isEmpty()).toBe(true)
    })

    it('should correctly encode/decode with custom receiver and hooks', () => {
      const customReceiver = new Address('0x742d35cc6634c0532925a3b844bc9e7595f0beb7')
      const traits = TakerTraits.new({
        exactIn: false,
        shouldUnwrap: true,
        strictThreshold: true,
        firstTransferFromTaker: true,
        useTransferFromAndAquaPush: true,
        threshold: BigInt('1000000000000000000'),
        customReceiver: customReceiver,
        preTransferInHookData: new HexString('0x1234'),
        postTransferOutHookData: new HexString('0x5678'),
        instructionsArgs: new HexString('0xaabbccdd'),
      })

      const encoded = traits.encode()
      const decoded = TakerTraits.decode(encoded)

      expect(decoded.exactIn).toBe(false)
      expect(decoded.shouldUnwrap).toBe(true)
      expect(decoded.strictThreshold).toBe(true)
      expect(decoded.useTransferFromAndAquaPush).toBe(true)
      expect(decoded.threshold).toBe(BigInt('1000000000000000000'))
      expect(decoded.customReceiver.toString()).toBe(customReceiver.toString())
      expect(decoded.preTransferInHookData.toString()).toBe('0x1234')
      expect(decoded.postTransferOutHookData.toString()).toBe('0x5678')
      expect(decoded.instructionsArgs.toString()).toBe('0xaabbccdd')
    })
  })
})
