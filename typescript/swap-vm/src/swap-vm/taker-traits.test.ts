import {describe, it, expect} from 'vitest'
import {Address, HexString} from '@1inch/sdk-shared'
import {TakerTraits} from './taker-traits'

describe('TakerTraits', () => {
    const mockReceiver = Address.fromBigInt(2n)

    describe('default', () => {
        it('should create default traits with all flags off', () => {
            const traits = TakerTraits.default()

            expect(traits.isExactIn()).toBe(true)
            expect(traits.shouldUnwrapWeth()).toBe(false)
            expect(traits.hasPreTransferInHook()).toBe(false)
            expect(traits.isStrictThresholdAmount()).toBe(false)
            expect(traits.hasThreshold()).toBe(false)
            expect(traits.hasCustomReceiver()).toBe(false)
            expect(traits.isFirstTransferFromTaker()).toBe(false)
            expect(traits.isUseTransferFromAndAquaPush()).toBe(false)
            expect(traits.getThreshold()).toBe(undefined)
            expect(traits.getTo()).toBe(undefined)
        })
    })

    describe('fromParams', () => {
        it('should build traits with specified flags', () => {
            const threshold = 1000000n
            const traits = TakerTraits.fromParams({
                isExactIn: true,
                shouldUnwrapWeth: true,
                hasPreTransferInHook: false,
                isStrictThresholdAmount: true,
                isFirstTransferFromTaker: true,
                useTransferFromAndAquaPush: false,
                threshold,
                customReceiver: mockReceiver
            })

            expect(traits.isExactIn()).toBe(true)
            expect(traits.shouldUnwrapWeth()).toBe(true)
            expect(traits.hasPreTransferInHook()).toBe(false)
            expect(traits.isStrictThresholdAmount()).toBe(true)
            expect(traits.isFirstTransferFromTaker()).toBe(true)
            expect(traits.isUseTransferFromAndAquaPush()).toBe(false)
            expect(traits.hasThreshold()).toBe(true)
            expect(traits.getThreshold()).toBe(threshold)
            expect(traits.hasCustomReceiver()).toBe(true)
            expect(traits.getTo()?.toString()).toBe(mockReceiver.toString())
        })
    })

    describe('flags', () => {
        it('should set and unset exactIn flag', () => {
            const traits = TakerTraits.default()

            traits.withExactIn()
            expect(traits.isExactIn()).toBe(true)

            traits.withExactOut()
            expect(traits.isExactIn()).toBe(false)
        })

        it('should set and unset shouldUnwrap flag', () => {
            const traits = TakerTraits.default()

            traits.withShouldUnwrap()
            expect(traits.shouldUnwrapWeth()).toBe(true)

            traits.withoutShouldUnwrap()
            expect(traits.shouldUnwrapWeth()).toBe(false)
        })

        it('should set and unset preTransferIn hook flag', () => {
            const traits = TakerTraits.default()

            traits.withPreTransferInHook()
            expect(traits.hasPreTransferInHook()).toBe(true)

            traits.withoutPreTransferInHook()
            expect(traits.hasPreTransferInHook()).toBe(false)
        })

        it('should set and unset strict threshold flag', () => {
            const traits = TakerTraits.default()

            traits.withStrictThreshold()
            expect(traits.isStrictThresholdAmount()).toBe(true)

            traits.withoutStrictThreshold()
            expect(traits.isStrictThresholdAmount()).toBe(false)
        })

        it('should set and unset firstTransferFromTaker flag', () => {
            const traits = TakerTraits.default()

            traits.withFirstTransferFromTaker()
            expect(traits.isFirstTransferFromTaker()).toBe(true)

            traits.withoutFirstTransferFromTaker()
            expect(traits.isFirstTransferFromTaker()).toBe(false)
        })

        it('should set and unset transferFromAndAquaPush flag', () => {
            const traits = TakerTraits.default()

            traits.withUseTransferFromAndAquaPush()
            expect(traits.isUseTransferFromAndAquaPush()).toBe(true)

            traits.withoutUseTransferFromAndAquaPush()
            expect(traits.isUseTransferFromAndAquaPush()).toBe(false)
        })
    })

    describe('threshold', () => {
        it('should set and get threshold', () => {
            const traits = TakerTraits.default()
            const threshold = 1000000n

            traits.withThreshold(threshold)
            expect(traits.hasThreshold()).toBe(true)
            expect(traits.getThreshold()).toBe(threshold)

            traits.withoutThreshold()
            expect(traits.hasThreshold()).toBe(false)
            expect(traits.getThreshold()).toBe(undefined)
        })
    })

    describe('receiver', () => {
        it('should set and get receiver', () => {
            const traits = TakerTraits.default()

            traits.withCustomReceiver(mockReceiver)
            expect(traits.hasCustomReceiver()).toBe(true)
            expect(traits.getTo()?.toString()).toBe(mockReceiver.toString())

            traits.withoutCustomReceiver()
            expect(traits.hasCustomReceiver()).toBe(false)
            expect(traits.getTo()).toBe(undefined)
        })
    })

    describe('encode/decode', () => {
        it('should encode and decode traits with threshold and receiver', () => {
            const threshold = 1000000n
            const originalTraits = TakerTraits.fromParams({
                isExactIn: true,
                shouldUnwrapWeth: true,
                threshold,
                customReceiver: mockReceiver
            })

            const encoded = originalTraits.encode()
            expect(encoded).toBeInstanceOf(HexString)

            const decoded = TakerTraits.fromBytes(encoded)

            expect(decoded.isExactIn()).toBe(true)
            expect(decoded.shouldUnwrapWeth()).toBe(true)
            expect(decoded.getThreshold()).toBe(threshold)
            expect(decoded.getTo()?.toString()).toBe(mockReceiver.toString())
        })

        it('should encode and decode traits without optional fields', () => {
            const originalTraits = TakerTraits.fromParams({
                isExactIn: true,
                hasPreTransferInHook: true
            })

            const encoded = originalTraits.encode()
            const decoded = TakerTraits.fromBytes(encoded)

            expect(decoded.isExactIn()).toBe(true)
            expect(decoded.hasPreTransferInHook()).toBe(true)
            expect(decoded.hasThreshold()).toBe(false)
            expect(decoded.hasCustomReceiver()).toBe(false)
            expect(decoded.getTo()).toBeUndefined()
        })
    })

    describe('getFlags', () => {
        it('should return combined flags as BN', () => {
            const traits = TakerTraits.fromParams({
                isExactIn: true, // bit 0 set = value 1
                shouldUnwrapWeth: true, // bit 1 set = value 2
                hasPreTransferInHook: true // bit 2 set = value 4
            })

            const flags = traits.getFlags()
            expect(flags.value).toBe(7n)
        })
    })

    describe('validate', () => {
        it('should validate exact input with minimum output threshold', () => {
            const threshold = 1000n
            const traits = TakerTraits.fromParams({
                isExactIn: true,
                threshold
            })

            expect(() => traits.validate(500n, 1000n)).not.toThrow()
            expect(() => traits.validate(500n, 1500n)).not.toThrow()

            expect(() => traits.validate(500n, 999n)).toThrow(
                'TakerTraitsInsufficientMinOutputAmount: amountOut 999 < threshold 1000'
            )
        })

        it('should validate exact output with maximum input threshold', () => {
            const threshold = 1000n
            const traits = TakerTraits.fromParams({
                threshold
            })

            // by default exact in is a true, so we need to switch to exact out
            traits.withExactOut()

            expect(() => traits.validate(1000n, 500n)).not.toThrow()
            expect(() => traits.validate(900n, 500n)).not.toThrow()

            expect(() => traits.validate(1001n, 500n)).toThrow(
                'TakerTraitsExceedingMaxInputAmount: amountIn 1001 > threshold 1000'
            )
        })

        it('should validate strict threshold amount', () => {
            const threshold = 1000n
            const traits = TakerTraits.fromParams({
                isStrictThresholdAmount: true,
                threshold
            })

            expect(() => traits.validate(500n, 1000n)).not.toThrow()

            expect(() => traits.validate(500n, 999n)).toThrow(
                'TakerTraitsNonExactThresholdAmount: amountOut 999 != threshold 1000'
            )
            expect(() => traits.validate(500n, 1001n)).toThrow(
                'TakerTraitsNonExactThresholdAmount: amountOut 1001 != threshold 1000'
            )
        })

        it('should not validate when no threshold is set', () => {
            const traits = TakerTraits.fromParams({
                isExactIn: true
            })

            expect(() => traits.validate(1000n, 500n)).not.toThrow()
            expect(() => traits.validate(1n, 1n)).not.toThrow()
        })
    })
})
