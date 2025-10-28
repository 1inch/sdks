import {describe, it, expect} from 'vitest'
import {Address} from '@1inch/sdk-shared'
import {MakerTraits} from './maker-traits'

describe('MakerTraits', () => {
    describe('default', () => {
        it('should create default traits with all flags off', () => {
            const traits = MakerTraits.default()

            expect(traits.shouldUnwrapWeth()).toBe(false)
            expect(traits.hasPreTransferOutHook()).toBe(false)
            expect(traits.hasPostTransferInHook()).toBe(false)
            expect(traits.isUseOfAquaInsteadOfSignatureEnabled()).toBe(false)
            expect(traits.isIgnoreOfAquaForTransferInEnabled()).toBe(false)
            expect(traits.expiration()).toBe(null)
            expect(traits.customReceiver()).toBe(null)
            expect(traits.preTransferOutDataLength()).toBe(0n)
            expect(traits.postTransferInDataLength()).toBe(0n)
        })
    })

    describe('build', () => {
        it('should build traits with specified flags', () => {
            const receiver = Address.fromBigInt(1n)

            const traits = MakerTraits.fromParams({
                shouldUnwrapWeth: true,
                hasPreTransferOutHook: true,
                hasPostTransferInHook: false,
                useAquaInsteadOfSignature: true,
                ignoreAquaForTransferIn: false,
                expiration: 1234567890n,
                receiver,
                preTransferOutDataLength: 100n,
                postTransferInDataLength: 200n
            })

            expect(traits.shouldUnwrapWeth()).toBe(true)
            expect(traits.hasPreTransferOutHook()).toBe(true)
            expect(traits.hasPostTransferInHook()).toBe(false)
            expect(traits.isUseOfAquaInsteadOfSignatureEnabled()).toBe(true)
            expect(traits.isIgnoreOfAquaForTransferInEnabled()).toBe(false)
            expect(traits.expiration()).toBe(1234567890n)
            expect(traits.customReceiver()?.toString()).toBe(
                receiver.toString()
            )
            expect(traits.preTransferOutDataLength()).toBe(100n)
            expect(traits.postTransferInDataLength()).toBe(200n)
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

        it('should set and unset preTransferOut hook flag', () => {
            const traits = MakerTraits.default()

            traits.enablePreTransferOutHook()
            expect(traits.hasPreTransferOutHook()).toBe(true)

            traits.disablePreTransferOutHook()
            expect(traits.hasPreTransferOutHook()).toBe(false)
        })

        it('should set and unset postTransferIn hook flag', () => {
            const traits = MakerTraits.default()

            traits.enablePostTransferInHook()
            expect(traits.hasPostTransferInHook()).toBe(true)

            traits.disablePostTransferInHook()
            expect(traits.hasPostTransferInHook()).toBe(false)
        })

        it('should set and unset useAquaInsteadOfSignature flag', () => {
            const traits = MakerTraits.default()

            traits.enableUseOfAquaInsteadOfSignature()
            expect(traits.isUseOfAquaInsteadOfSignatureEnabled()).toBe(true)

            traits.disableUseAquaInsteadOfSignature()
            expect(traits.isUseOfAquaInsteadOfSignatureEnabled()).toBe(false)
        })

        it('should set and unset ignoreAquaForTransferIn flag', () => {
            const traits = MakerTraits.default()

            traits.enableIgnoreOfAquaForTransferIn()
            expect(traits.isIgnoreOfAquaForTransferInEnabled()).toBe(true)

            traits.disableIgnoreAquaForTransferIn()
            expect(traits.isIgnoreOfAquaForTransferInEnabled()).toBe(false)
        })
    })

    describe('expiration', () => {
        it('should set and get expiration', () => {
            const traits = MakerTraits.default()
            const expiration = 1234567890n

            traits.withExpiration(expiration)
            expect(traits.expiration()).toBe(expiration)
        })
    })

    describe('receiver', () => {
        it('should set and get receiver', () => {
            const traits = MakerTraits.default()
            const receiver = Address.fromBigInt(1n)

            traits.withCustomReceiver(receiver)
            expect(traits.customReceiver()?.toString()).toBe(
                receiver.toString()
            )
        })
    })

    describe('data lengths', () => {
        it('should set and get preTransferOut data length', () => {
            const traits = MakerTraits.default()

            traits.withPreTransferOutDataLength(100n)
            expect(traits.preTransferOutDataLength()).toBe(100n)
        })

        it('should set and get postTransferIn data length', () => {
            const traits = MakerTraits.default()

            traits.withPostTransferInDataLength(200n)
            expect(traits.postTransferInDataLength()).toBe(200n)
        })
    })

    describe('conversion', () => {
        it('should convert to bigint', () => {
            const traits = MakerTraits.default()
                .withShouldUnwrap()
                .withExpiration(1234567890n)

            const bigintValue = traits.asBigInt()
            expect(typeof bigintValue).toBe('bigint')

            const traitsFromBigint = new MakerTraits(bigintValue)
            expect(traitsFromBigint.shouldUnwrapWeth()).toBe(true)
            expect(traitsFromBigint.expiration()).toBe(1234567890n)
        })
    })
})
