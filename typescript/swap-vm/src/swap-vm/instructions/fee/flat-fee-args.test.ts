import {describe, it, expect} from 'vitest'
import {FlatFeeArgs} from './flat-fee-args'

describe('FlatFeeArgs', () => {
    it('should encode and decode flat fee args', () => {
        const feeBps = 30000000n
        const args = new FlatFeeArgs(feeBps)

        const encoded = FlatFeeArgs.CODER.encode(args)
        expect(encoded.toString()).toBe('0x01c9c380')

        const decoded = FlatFeeArgs.decode(encoded)
        expect(decoded.feeBps).toBe(feeBps)
    })

    it('should handle maximum fee (100%)', () => {
        const maxFee = 1000000000n
        const args = new FlatFeeArgs(maxFee)

        const encoded = FlatFeeArgs.CODER.encode(args)
        const decoded = FlatFeeArgs.decode(encoded)

        expect(decoded.feeBps).toBe(maxFee)
    })

    it('should handle minimum fee (0%)', () => {
        const minFee = 0n
        const args = new FlatFeeArgs(minFee)

        const encoded = FlatFeeArgs.CODER.encode(args)
        expect(encoded.toString()).toBe('0x00000000')

        const decoded = FlatFeeArgs.decode(encoded)
        expect(decoded.feeBps).toBe(minFee)
    })

    it('should convert to JSON correctly', () => {
        const args = new FlatFeeArgs(15000000n)
        const json = args.toJSON()

        expect(json).toEqual({
            feeBps: '15000000'
        })
    })

    it('should throw on invalid values', () => {
        const maxUint32 = (1n << 32n) - 1n
        const BPS = 1000000000n

        expect(() => new FlatFeeArgs(-1n)).toThrow()

        expect(() => new FlatFeeArgs(maxUint32 + 1n)).toThrow()

        expect(() => new FlatFeeArgs(BPS + 1n)).toThrow('Fee out of range')
    })

    it('should handle common fee percentages', () => {
        const testCases = [
            {pct: '0.1%', value: 1000000n},
            {pct: '0.3%', value: 3000000n},
            {pct: '1%', value: 10000000n},
            {pct: '2.5%', value: 25000000n},
            {pct: '5%', value: 50000000n},
            {pct: '10%', value: 100000000n}
        ]

        testCases.forEach(({pct, value}) => {
            const args = new FlatFeeArgs(value)
            const encoded = FlatFeeArgs.CODER.encode(args)
            const decoded = FlatFeeArgs.decode(encoded)

            expect(decoded.feeBps).toBe(value)
        })
    })

    it('should enforce BPS limit', () => {
        const BPS = 1000000000n

        expect(() => new FlatFeeArgs(BPS)).not.toThrow()

        expect(() => new FlatFeeArgs(BPS + 1n)).toThrow()
        expect(() => new FlatFeeArgs(2n * BPS)).toThrow()
    })
})
