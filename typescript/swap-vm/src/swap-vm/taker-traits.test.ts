// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { afterEach, describe, it, expect, vi } from 'vitest'
import { UINT_256_MAX, UINT_40_MAX } from '@1inch/byte-utils'
import { Address, HexString, type DataFor } from '@1inch/sdk-core'
import { TakerTraits } from './taker-traits'

const fluentChainReceiver = Address.fromBigInt(0xaaaan)

function expectFluentChainResult(traits: TakerTraits, receiver: Address): void {
  expect(traits.exactIn).toBe(false)
  expect(traits.threshold).toBe(2000n)
  expect(traits.customReceiver.equal(receiver)).toBe(true)
  expect(traits.strictThreshold).toBe(true)
  expect(traits.useTransferFromAndAquaPush).toBe(true)

  const decoded = TakerTraits.decode(traits.encode())
  expect(decoded.exactIn).toBe(false)
  expect(decoded.threshold).toBe(2000n)
  expect(decoded.customReceiver.equal(receiver)).toBe(true)
  expect(decoded.strictThreshold).toBe(true)
}

function registerDefaultTraitsTests(): void {
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
}

describe('TakerTraits', () => {
  const mockReceiver = Address.fromBigInt(2n)

  registerDefaultTraitsTests()

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
    // Bytes 18..20 (the uint16 right before the flags) hold the end offset of the threshold
    // section; the router only checks the threshold when that section is exactly 32 bytes long
    const thresholdSectionLength = (traits: TakerTraits): number =>
      Number(traits.encode().sliceBytes(18, 20).toBigInt())

    it('should leave the threshold section out by default, so the swap has no slippage check', () => {
      expect(TakerTraits.default().threshold).toBe(0n)
      expect(thresholdSectionLength(TakerTraits.default())).toBe(0)
      expect(thresholdSectionLength(TakerTraits.new())).toBe(0)
    })

    it('should encode a threshold derived from a quote and slippage tolerance as a 32-byte section', () => {
      const quotedAmountOut = 39_123_456_789_012_345n
      const slippageBps = 50n
      const minAmountOut = (quotedAmountOut * (10_000n - slippageBps)) / 10_000n

      const traits = TakerTraits.default().with({ threshold: minAmountOut })
      const encoded = traits.encode()

      expect(thresholdSectionLength(traits)).toBe(32)
      expect(encoded.sliceBytes(22, 54).toBigInt()).toBe(minAmountOut)
      expect(TakerTraits.new({ threshold: minAmountOut }).encode()).toEqual(encoded)

      expect(() => traits.validate(1n, quotedAmountOut)).not.toThrow()
      expect(() => traits.validate(1n, minAmountOut)).not.toThrow()
      expect(() => traits.validate(1n, minAmountOut - 1n)).toThrow(
        'TakerTraitsInsufficientMinOutputAmount',
      )
    })

    it('should set and get threshold', () => {
      const traits = TakerTraits.default()
      const threshold = 1000000n

      const withThreshold = traits.with({ threshold })
      expect(withThreshold.threshold !== undefined && withThreshold.threshold > 0n).toBe(true)
      expect(withThreshold.threshold).toBe(threshold)

      const withoutThreshold = withThreshold.with({ threshold: undefined })
      expect(withoutThreshold.threshold).toBe(0n)
      expect(() => withoutThreshold.encode()).not.toThrow()
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
      expect(withoutReceiver.customReceiver.isZero()).toBe(true)
      expect(() => withoutReceiver.encode()).not.toThrow()
    })
  })

  describe('with', () => {
    it('should mutate the receiver in place and return it', () => {
      const base = TakerTraits.new({ threshold: 1000n, exactIn: true })
      const same = base.with({ exactIn: false, threshold: 2000n })

      expect(same).toBe(base)
      expect(base.exactIn).toBe(false)
      expect(base.threshold).toBe(2000n)
    })

    it('should encode after clearing fields with undefined', () => {
      const traits = TakerTraits.default()
        .with({ customReceiver: mockReceiver, threshold: 1n })
        .with({ customReceiver: undefined, threshold: undefined })

      expect(traits.customReceiver.isZero()).toBe(true)
      expect(traits.threshold).toBe(0n)
      expect(traits.encode().toString()).toBe(TakerTraits.default().encode().toString())
    })
  })

  describe('withNew', () => {
    const receiverA = fluentChainReceiver
    const receiverB = Address.fromBigInt(0xbbbbn)

    it('should return a new instance and leave the original unchanged', () => {
      const base = TakerTraits.new({
        threshold: 1000n,
        customReceiver: receiverA,
        deadline: 1735689600n,
        instructionsArgs: new HexString('0x0102'),
      })
      const baseEncoded = base.encode().toString()

      const derived = base.withNew({ exactIn: false, customReceiver: receiverB })

      expect(derived).toBeInstanceOf(TakerTraits)
      expect(derived).not.toBe(base)
      expect(derived.exactIn).toBe(false)
      expect(derived.customReceiver.equal(receiverB)).toBe(true)
      expect(derived.threshold).toBe(1000n)
      expect(derived.deadline).toBe(1735689600n)
      expect(derived.instructionsArgs.toString()).toBe('0x0102')

      expect(base.exactIn).toBe(true)
      expect(base.customReceiver.equal(receiverA)).toBe(true)
      expect(base.encode().toString()).toBe(baseEncoded)
    })

    it('should derive independent instances from the same base', () => {
      const base = TakerTraits.default()

      const toA = base.withNew({ customReceiver: receiverA })
      const toB = base.withNew({ customReceiver: receiverB })

      expect(toA).not.toBe(toB)
      expect(toA.customReceiver.equal(receiverA)).toBe(true)
      expect(toB.customReceiver.equal(receiverB)).toBe(true)
      expect(base.customReceiver.isZero()).toBe(true)

      expect(TakerTraits.decode(toA.encode()).customReceiver.equal(receiverA)).toBe(true)
      expect(TakerTraits.decode(toB.encode()).customReceiver.equal(receiverB)).toBe(true)
      expect(base.encode().toString()).toBe(TakerTraits.default().encode().toString())
    })

    it('should return an equal copy when no fields are updated', () => {
      const base = TakerTraits.new({ threshold: 5n, signature: new HexString('0xabcd') })

      const copy = base.withNew({})

      expect(copy).not.toBe(base)
      expect(copy).toEqual(base)
      expect(copy.encode().toString()).toBe(base.encode().toString())
    })

    it('should reset keys set to undefined to canonical defaults', () => {
      const base = TakerTraits.new({
        exactIn: false,
        threshold: 1000n,
        customReceiver: receiverA,
        deadline: 1735689600n,
        preTransferInHookData: new HexString('0x1234'),
        signature: new HexString('0xabcd'),
      })

      const updated = base.withNew({
        exactIn: undefined,
        threshold: undefined,
        customReceiver: undefined,
        deadline: undefined,
        preTransferInHookData: undefined,
        signature: undefined,
        shouldUnwrap: true,
      })

      expect(updated.exactIn).toBe(true)
      expect(updated.threshold).toBe(0n)
      expect(updated.customReceiver.isZero()).toBe(true)
      expect(updated.deadline).toBe(0n)
      expect(updated.preTransferInHookData.toString()).toBe(HexString.EMPTY.toString())
      expect(updated.signature.toString()).toBe(HexString.EMPTY.toString())
      expect(updated.shouldUnwrap).toBe(true)
      expect(updated.encode().toString()).toBe(
        TakerTraits.new({ shouldUnwrap: true }).encode().toString(),
      )
    })

    it('should encode after updating fields with undefined values', () => {
      const traits = TakerTraits.default().withNew({
        customReceiver: undefined,
        threshold: undefined,
        deadline: undefined,
        signature: undefined,
      })

      expect(() => traits.encode()).not.toThrow()
      expect(traits.encode().toString()).toBe(TakerTraits.default().encode().toString())
    })
  })

  describe('partial update helpers', () => {
    it.each([
      {
        label: 'with',
        chain: (): TakerTraits =>
          TakerTraits.default()
            .with({ exactIn: false, threshold: 2000n })
            .with({ customReceiver: fluentChainReceiver })
            .with({ strictThreshold: true }),
      },
      {
        label: 'withNew',
        chain: (): TakerTraits =>
          TakerTraits.default()
            .withNew({ exactIn: false, threshold: 2000n })
            .withNew({ customReceiver: fluentChainReceiver })
            .withNew({ strictThreshold: true }),
      },
    ])('should support fluent chaining via $label', ({ chain }) => {
      expectFluentChainResult(chain(), fluentChainReceiver)
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

  describe('decode', () => {
    const EXACT_IN_AQUA_PUSH_FLAGS = 0x41
    const PRE_TRANSFER_IN_CALLBACK_FLAG = 0x04
    const PRE_TRANSFER_OUT_CALLBACK_FLAG = 0x08

    const packRaw = (
      offsets: number[],
      data: string,
      flags = EXACT_IN_AQUA_PUSH_FLAGS,
    ): HexString =>
      new HexString(
        '0x' +
          [...offsets]
            .reverse()
            .map((offset) => offset.toString(16).padStart(4, '0'))
            .join('') +
          flags.toString(16).padStart(4, '0') +
          data,
      )

    const pack = (
      sections: string[],
      flags = EXACT_IN_AQUA_PUSH_FLAGS,
      signature = '',
    ): HexString => {
      const offsets = Array.from({ length: 10 }, (_, i) =>
        sections.slice(0, i + 1).reduce((sum, section) => sum + section.length / 2, 0),
      )

      return packRaw(offsets, sections.join('') + signature, flags)
    }

    const expectByteIdenticalRoundTrip = (traits: TakerTraits, label?: string): void => {
      const encoded = traits.encode()

      expect(TakerTraits.decode(encoded).encode().toString(), label).toBe(encoded.toString())
    }

    const signature = new HexString(
      '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d' +
        '4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c1b',
    )

    it('should decode TakerTraitsLib.build output and re-encode it byte-identically', () => {
      const built = new HexString(
        '0x004a004600440041003f003d003b003900340020003e' +
          '0000000000000000000000000000000000000000000000000de0b6b3a7640000' +
          '742d35cc6634c0532925a3b844bc9e7595f0beb7' +
          '0067748580' +
          '123456789abcdef0' +
          'abcdef0102' +
          'aabbccdd' +
          signature.toString().slice(2),
      )

      const decoded = TakerTraits.decode(built)

      expect(decoded.exactIn).toBe(false)
      expect(decoded.shouldUnwrap).toBe(true)
      expect(decoded.strictThreshold).toBe(true)
      expect(decoded.firstTransferFromTaker).toBe(true)
      expect(decoded.useTransferFromAndAquaPush).toBe(false)
      expect(decoded.threshold).toBe(10n ** 18n)
      expect(decoded.customReceiver.toString()).toBe('0x742d35cc6634c0532925a3b844bc9e7595f0beb7')
      expect(decoded.deadline).toBe(1735689600n)
      expect(decoded.preTransferInHookData.toString()).toBe('0x1234')
      expect(decoded.postTransferInHookData.toString()).toBe('0x5678')
      expect(decoded.preTransferOutHookData.toString()).toBe('0x9abc')
      expect(decoded.postTransferOutHookData.toString()).toBe('0xdef0')
      expect(decoded.preTransferInCallbackEnabled).toBe(true)
      expect(decoded.preTransferInCallbackData.toString()).toBe('0xabcdef')
      expect(decoded.preTransferOutCallbackEnabled).toBe(true)
      expect(decoded.preTransferOutCallbackData.toString()).toBe('0x0102')
      expect(decoded.instructionsArgs.toString()).toBe('0xaabbccdd')
      expect(decoded.signature.equal(signature)).toBe(true)
      expect(decoded.encode().toString()).toBe(built.toString())
    })

    it('should decode callback flags without callback data and re-encode them', () => {
      const built = new HexString('0x0000000000000000000000000000000000000000000d')

      const decoded = TakerTraits.decode(built)

      expect(decoded.preTransferInCallbackEnabled).toBe(true)
      expect(decoded.preTransferOutCallbackEnabled).toBe(true)
      expect(decoded.preTransferInCallbackData.isEmpty()).toBe(true)
      expect(decoded.preTransferOutCallbackData.isEmpty()).toBe(true)
      expect(decoded.encode().toString()).toBe(built.toString())
    })

    it('should round-trip every flag combination byte-identically', () => {
      const allFields: Partial<DataFor<TakerTraits>> = {
        threshold: 1n,
        customReceiver: mockReceiver,
        deadline: 1n,
        preTransferInHookData: new HexString('0x01'),
        postTransferInHookData: new HexString('0x02'),
        preTransferOutHookData: new HexString('0x03'),
        postTransferOutHookData: new HexString('0x04'),
        preTransferInCallbackData: new HexString('0x05'),
        preTransferOutCallbackData: new HexString('0x06'),
        instructionsArgs: new HexString('0x07'),
        signature,
      }

      for (let flags = 0; flags < 1 << 7; flags++) {
        const flagFields: Partial<DataFor<TakerTraits>> = {
          exactIn: Boolean(flags & 0x01),
          shouldUnwrap: Boolean(flags & 0x02),
          preTransferInCallbackEnabled: Boolean(flags & 0x04),
          preTransferOutCallbackEnabled: Boolean(flags & 0x08),
          strictThreshold: Boolean(flags & 0x10),
          firstTransferFromTaker: Boolean(flags & 0x20),
          useTransferFromAndAquaPush: Boolean(flags & 0x40),
        }

        expectByteIdenticalRoundTrip(TakerTraits.new(flagFields), `flags ${flags}`)
        expectByteIdenticalRoundTrip(
          TakerTraits.new({ ...flagFields, ...allFields }),
          `flags ${flags} with all fields`,
        )
      }
    })

    it('should round-trip every combination of optional fields byte-identically', () => {
      const optionalFields: Partial<DataFor<TakerTraits>>[] = [
        { threshold: 25000000000000000000n },
        { customReceiver: new Address('0x742d35cc6634c0532925a3b844bc9e7595f0beb7') },
        { deadline: 1735689600n },
        { preTransferInHookData: new HexString('0x1234') },
        { postTransferInHookData: new HexString('0x5678') },
        { preTransferOutHookData: new HexString('0x9abc') },
        { postTransferOutHookData: new HexString('0xdef0') },
        { preTransferInCallbackData: new HexString('0xabcdef') },
        { preTransferOutCallbackData: new HexString('0x0102') },
        { instructionsArgs: new HexString('0xaabbccdd') },
        { signature },
      ]

      for (let mask = 0; mask < 1 << optionalFields.length; mask++) {
        const fields = optionalFields.filter((_, i) => (mask >> i) & 1)
        const traits = TakerTraits.new(Object.assign({ exactIn: mask % 3 !== 0 }, ...fields))

        expectByteIdenticalRoundTrip(traits, `fields mask ${mask}`)
      }
    })

    it.each([1, 31, 33, 64])('should decode a threshold section of length %i as absent', (size) => {
      const decoded = TakerTraits.decode(pack(['ff'.repeat(size), '', '', '1234']))

      expect(decoded.threshold).toBe(0n)
      expect(decoded.preTransferInHookData.toString()).toBe('0x1234')
    })

    it.each([1, 19, 21, 32])(
      'should decode a receiver section of length %i as the taker',
      (size) => {
        const decoded = TakerTraits.decode(pack(['', '11'.repeat(size), '', '1234']))

        expect(decoded.customReceiver.isZero()).toBe(true)
        expect(decoded.preTransferInHookData.toString()).toBe('0x1234')
      },
    )

    it.each([1, 4, 6, 8])('should decode a deadline section of length %i as absent', (size) => {
      const decoded = TakerTraits.decode(pack(['', '', 'ff'.repeat(size), '1234']))

      expect(decoded.deadline).toBe(0n)
      expect(decoded.preTransferInHookData.toString()).toBe('0x1234')
    })

    it('should decode exactly sized threshold, receiver and deadline sections', () => {
      const decoded = TakerTraits.decode(
        pack(['00'.repeat(31) + '2a', '00'.repeat(19) + '02', '0000000001']),
      )

      expect(decoded.threshold).toBe(42n)
      expect(decoded.customReceiver.equal(mockReceiver)).toBe(true)
      expect(decoded.deadline).toBe(1n)
    })

    it('should decode a 5-byte zero deadline as no deadline', () => {
      const decoded = TakerTraits.decode(pack(['', '', '00'.repeat(5)]))

      expect(decoded.deadline).toBe(0n)
    })

    it('should reject a 32-byte zero threshold', () => {
      expect(() => TakerTraits.decode(pack(['00'.repeat(32)]))).toThrow(
        'Unsupported TakerTraits: 32-byte zero threshold',
      )
    })

    it('should reject a 20-byte zero receiver', () => {
      expect(() => TakerTraits.decode(pack(['', '00'.repeat(20)]))).toThrow(
        'Unsupported TakerTraits: 20-byte zero receiver',
      )
    })

    it('should reject pre-transfer-in callback data without its callback flag', () => {
      const sections = ['', '', '', '', '', '', '', 'abcd']

      expect(() => TakerTraits.decode(pack(sections))).toThrow(
        'Unsupported TakerTraits: preTransferInCallbackData is set but its callback flag is not',
      )

      const withFlag = pack(sections, EXACT_IN_AQUA_PUSH_FLAGS | PRE_TRANSFER_IN_CALLBACK_FLAG)
      const decoded = TakerTraits.decode(withFlag)
      expect(decoded.preTransferInCallbackEnabled).toBe(true)
      expect(decoded.preTransferInCallbackData.toString()).toBe('0xabcd')
      expect(decoded.encode().toString()).toBe(withFlag.toString())
    })

    it('should reject pre-transfer-out callback data without its callback flag', () => {
      const sections = ['', '', '', '', '', '', '', '', 'abcd']

      expect(() => TakerTraits.decode(pack(sections))).toThrow(
        'Unsupported TakerTraits: preTransferOutCallbackData is set but its callback flag is not',
      )

      const withFlag = pack(sections, EXACT_IN_AQUA_PUSH_FLAGS | PRE_TRANSFER_OUT_CALLBACK_FLAG)
      const decoded = TakerTraits.decode(withFlag)
      expect(decoded.preTransferOutCallbackEnabled).toBe(true)
      expect(decoded.preTransferOutCallbackData.toString()).toBe('0xabcd')
      expect(decoded.encode().toString()).toBe(withFlag.toString())
    })

    it('should reject decreasing section offsets', () => {
      expect(() => TakerTraits.decode(packRaw([0, 0, 4, 2, 2, 2, 2, 2, 2, 2], 'aabbccdd'))).toThrow(
        'Invalid TakerTraits: section offset 2 is lower than the previous offset 4',
      )
      expect(() => TakerTraits.decode(packRaw([2, 2, 2, 2, 2, 2, 2, 2, 2, 1], 'aabb'))).toThrow(
        'Invalid TakerTraits: section offset 1 is lower than the previous offset 2',
      )
    })

    it('should reject section offsets beyond the data', () => {
      expect(() => TakerTraits.decode(packRaw([0, 0, 0, 8, 8, 8, 8, 8, 8, 8], 'aabb'))).toThrow(
        'Invalid TakerTraits: section offset 8 exceeds the data length 2',
      )
      expect(() => TakerTraits.decode(packRaw([0, 0, 0, 0, 0, 0, 0, 0, 0, 3], 'aabb'))).toThrow(
        'Invalid TakerTraits: section offset 3 exceeds the data length 2',
      )
    })

    it('should read the signature from the bytes after the last section', () => {
      const withSignature = TakerTraits.decode(
        pack(['', '', '', '', '', '', '', '', '', 'aabb'], EXACT_IN_AQUA_PUSH_FLAGS, 'ccdd'),
      )
      expect(withSignature.instructionsArgs.toString()).toBe('0xaabb')
      expect(withSignature.signature.toString()).toBe('0xccdd')

      const withoutSignature = TakerTraits.decode(
        pack(['', '', '', '', '', '', '', '', '', 'aabb']),
      )
      expect(withoutSignature.instructionsArgs.toString()).toBe('0xaabb')
      expect(withoutSignature.signature.isEmpty()).toBe(true)
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
    afterEach(() => {
      vi.useRealTimers()
    })

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
        'TakerTraitsNonExactThresholdAmountOut: amountOut 999 != threshold 1000',
      )
      expect(() => traits.validate(500n, 1001n)).toThrow(
        'TakerTraitsNonExactThresholdAmountOut: amountOut 1001 != threshold 1000',
      )
    })

    it('should validate strict threshold amount for exact output', () => {
      const traits = TakerTraits.new({
        exactIn: false,
        strictThreshold: true,
        threshold: 1000n,
      })

      expect(() => traits.validate(1000n, 500n)).not.toThrow()

      expect(() => traits.validate(999n, 500n)).toThrow(
        'TakerTraitsNonExactThresholdAmountIn: amountIn 999 != threshold 1000',
      )
      expect(() => traits.validate(1001n, 500n)).toThrow(
        'TakerTraitsNonExactThresholdAmountIn: amountIn 1001 != threshold 1000',
      )
    })

    it('should not validate when no threshold is set', () => {
      const traits = TakerTraits.new({
        exactIn: true,
      })

      expect(() => traits.validate(1000n, 500n)).not.toThrow()
      expect(() => traits.validate(1n, 1n)).not.toThrow()
    })

    it('should require amountOut to be greater than zero', () => {
      expect(() => TakerTraits.new({ exactIn: true }).validate(1000n, 0n)).toThrow(
        'TakerTraitsAmountOutMustBeGreaterThanZero: amountOut 0',
      )
      expect(() => TakerTraits.new({ exactIn: false }).validate(1000n, 0n)).toThrow(
        'TakerTraitsAmountOutMustBeGreaterThanZero: amountOut 0',
      )
      expect(() => TakerTraits.new({ exactIn: true }).validate(1000n, 1n)).not.toThrow()
    })

    it('should reject an expired deadline', () => {
      const deadline = 1735689600n
      const traits = TakerTraits.new({ deadline })

      expect(() => traits.validate(1n, 1n, { timestamp: deadline - 1n })).not.toThrow()
      expect(() => traits.validate(1n, 1n, { timestamp: deadline })).not.toThrow()
      expect(() => traits.validate(1n, 1n, { timestamp: deadline + 1n })).toThrow(
        'TakerTraitsDeadlineExpired: timestamp 1735689601 > deadline 1735689600',
      )
    })

    it('should check the deadline against the current unix time in seconds by default', () => {
      vi.useFakeTimers({ now: 1735689600999 })

      expect(() => TakerTraits.new({ deadline: 1735689600n }).validate(1n, 1n)).not.toThrow()
      expect(() => TakerTraits.new({ deadline: 1735689599n }).validate(1n, 1n)).toThrow(
        'TakerTraitsDeadlineExpired: timestamp 1735689600 > deadline 1735689599',
      )
    })

    it('should ignore the timestamp when no deadline is set', () => {
      expect(() => TakerTraits.default().validate(1n, 1n, { timestamp: 2n ** 64n })).not.toThrow()
    })

    it('should check takerAmount against amountIn for exact input', () => {
      const traits = TakerTraits.new({ exactIn: true })

      expect(() => traits.validate(100n, 50n, { takerAmount: 100n })).not.toThrow()
      expect(() => traits.validate(100n, 50n, { takerAmount: 50n })).toThrow(
        'TakerTraitsTakerAmountInMismatch: takerAmount 50 != amountIn 100',
      )
    })

    it('should check takerAmount against amountOut for exact output', () => {
      const traits = TakerTraits.new({ exactIn: false })

      expect(() => traits.validate(100n, 50n, { takerAmount: 50n })).not.toThrow()
      expect(() => traits.validate(100n, 50n, { takerAmount: 100n })).toThrow(
        'TakerTraitsTakerAmountOutMismatch: takerAmount 100 != amountOut 50',
      )
    })

    it('should throw for the first failing check in on-chain order for exact input', () => {
      const deadline = 1735689600n
      const traits = TakerTraits.new({ exactIn: true, threshold: 1000n, deadline })
      const expired = { takerAmount: 1n, timestamp: deadline + 1n }
      const inTime = { takerAmount: 1n, timestamp: deadline }

      expect(() => traits.validate(100n, 0n, expired)).toThrow(
        'TakerTraitsAmountOutMustBeGreaterThanZero',
      )
      expect(() => traits.validate(100n, 1n, expired)).toThrow('TakerTraitsDeadlineExpired')
      expect(() => traits.validate(100n, 1n, inTime)).toThrow('TakerTraitsTakerAmountInMismatch')
      expect(() => traits.validate(100n, 1n, { ...inTime, takerAmount: 100n })).toThrow(
        'TakerTraitsInsufficientMinOutputAmount',
      )
      expect(() => traits.validate(100n, 1000n, { ...inTime, takerAmount: 100n })).not.toThrow()
    })

    it('should throw for the first failing check in on-chain order for exact output', () => {
      const deadline = 1735689600n
      const traits = TakerTraits.new({ exactIn: false, threshold: 1000n, deadline })
      const expired = { takerAmount: 1n, timestamp: deadline + 1n }
      const inTime = { takerAmount: 1n, timestamp: deadline }

      expect(() => traits.validate(2000n, 0n, expired)).toThrow(
        'TakerTraitsAmountOutMustBeGreaterThanZero',
      )
      expect(() => traits.validate(2000n, 5n, expired)).toThrow('TakerTraitsDeadlineExpired')
      expect(() => traits.validate(2000n, 5n, inTime)).toThrow('TakerTraitsTakerAmountOutMismatch')
      expect(() => traits.validate(2000n, 5n, { ...inTime, takerAmount: 5n })).toThrow(
        'TakerTraitsExceedingMaxInputAmount',
      )
      expect(() => traits.validate(1000n, 5n, { ...inTime, takerAmount: 5n })).not.toThrow()
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
