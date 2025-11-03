import {describe, it, expect} from 'vitest'
import {Address} from '@1inch/sdk-shared'
import {ProtocolFeeArgs} from './protocol-fee-args'

describe('ProtocolFeeArgs', () => {
    const feeRecipient = new Address(
        '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
    )

    it('should encode and decode protocol fee args', () => {
        const feeBps = 10000000n // 1%
        const args = new ProtocolFeeArgs(feeBps, feeRecipient)

        const encoded = ProtocolFeeArgs.CODER.encode(args)
        expect(encoded.toString()).toBe(
            '0x0098968068b3465833fb72a70ecdf485e0e4c7bd8665fc45'
        )

        const decoded = ProtocolFeeArgs.decode(encoded)
        expect(decoded.feeBps).toBe(feeBps)
        expect(decoded.to.toString()).toBe(feeRecipient.toString())
    })

    it('should handle maximum fee with different addresses', () => {
        const maxFee = 1000000000n // 100%
        const addresses = [
            '0x0000000000000000000000000000000000000001',
            '0xffffffffffffffffffffffffffffffffffffffff',
            '0x742d35cc6634c0532925a3b844bc9e7595f0fa1b'
        ]

        addresses.forEach((addr) => {
            const recipient = new Address(addr)
            const args = new ProtocolFeeArgs(maxFee, recipient)

            const encoded = ProtocolFeeArgs.CODER.encode(args)
            const decoded = ProtocolFeeArgs.decode(encoded)

            expect(decoded.feeBps).toBe(maxFee)
            expect(decoded.to.toString()).toBe(recipient.toString())
        })
    })

    it('should handle minimum fee (0%)', () => {
        const minFee = 0n
        const args = new ProtocolFeeArgs(minFee, feeRecipient)

        const encoded = ProtocolFeeArgs.CODER.encode(args)
        const decoded = ProtocolFeeArgs.decode(encoded)

        expect(decoded.feeBps).toBe(minFee)
        expect(decoded.to.toString()).toBe(feeRecipient.toString())
    })

    it('should convert to JSON correctly', () => {
        const args = new ProtocolFeeArgs(5000000n, feeRecipient)
        const json = args.toJSON()

        expect(json).toEqual({
            feeBps: '5000000',
            to: feeRecipient.toString()
        })
    })

    it('should throw on invalid values', () => {
        const maxUint32 = (1n << 32n) - 1n
        const BPS = 1000000000n

        expect(() => new ProtocolFeeArgs(-1n, feeRecipient)).toThrow()

        expect(
            () => new ProtocolFeeArgs(maxUint32 + 1n, feeRecipient)
        ).toThrow()

        expect(() => new ProtocolFeeArgs(BPS + 1n, feeRecipient)).toThrow(
            'Fee out of range'
        )
    })

    it('should handle common protocol fee scenarios', () => {
        const testCases = [
            {
                desc: 'DEX fee',
                feeBps: 2500000n,
                recipient: '0x1111111254fb6c44bAC0beD2854e76F90643097d'
            }, // 0.25%
            {
                desc: 'Treasury fee',
                feeBps: 5000000n,
                recipient: '0xE37e799D5077682FA0a244D46E5649F71457BD09'
            }, // 0.5%
            {
                desc: 'Staking rewards',
                feeBps: 1000000n,
                recipient: '0x0000000000000000000000000000000000000000'
            } // 0.1%
        ]

        testCases.forEach(({feeBps, recipient}) => {
            const to = new Address(recipient)
            const args = new ProtocolFeeArgs(feeBps, to)
            const encoded = ProtocolFeeArgs.CODER.encode(args)
            const decoded = ProtocolFeeArgs.decode(encoded)

            expect(decoded.feeBps).toBe(feeBps)
            expect(decoded.to.toString().toLowerCase()).toBe(
                recipient.toLowerCase()
            )
        })
    })

    it('should enforce BPS limit', () => {
        const BPS = 1000000000n

        expect(() => new ProtocolFeeArgs(BPS, feeRecipient)).not.toThrow()

        expect(() => new ProtocolFeeArgs(BPS + 1n, feeRecipient)).toThrow()
        expect(() => new ProtocolFeeArgs(2n * BPS, feeRecipient)).toThrow()
    })

    it('should preserve address case in encoding/decoding', () => {
        const mixedCaseAddress = new Address(
            '0xabcdef1234567890123456789012345678901234'
        )
        const args = new ProtocolFeeArgs(1000000n, mixedCaseAddress)

        const encoded = ProtocolFeeArgs.CODER.encode(args)
        const decoded = ProtocolFeeArgs.decode(encoded)

        expect(decoded.to.toString().toLowerCase()).toBe(
            mixedCaseAddress.toString().toLowerCase()
        )
    })
})
