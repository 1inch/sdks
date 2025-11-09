import {describe, it, expect} from 'vitest'
import {Address, AddressHalf} from '@1inch/sdk-shared'
import {InvalidateTokenOut1DArgs} from './invalidate-token-out-1d-args'
import {InvalidateTokenOut1DArgsCoder} from './invalidate-token-out-1d-args-coder'

describe('InvalidateTokenOut1DArgs', () => {
    const coder = new InvalidateTokenOut1DArgsCoder()
    const DAI = new Address('0x6B175474E89094C44Da98b954EedeAC495271d0F')
    const LINK = new Address('0x514910771AF9Ca656af840dff83E8264EcF986CA')
    const LINK_HALF = AddressHalf.fromAddress(LINK)
    const DAI_HALF = AddressHalf.fromAddress(DAI)

    it('should encode and decode token output half', () => {
        const args = new InvalidateTokenOut1DArgs(DAI_HALF)

        const encoded = coder.encode(args)
        expect(encoded.toString().length).toBe(22)

        const decoded = coder.decode(encoded)
        expect(decoded.tokenOutHalf.toString()).toBe(DAI_HALF.toString())
    })

    it('should use static decode method', () => {
        const args = new InvalidateTokenOut1DArgs(DAI_HALF)
        const encoded = coder.encode(args)

        const decoded = InvalidateTokenOut1DArgs.decode(encoded)
        expect(decoded.tokenOutHalf.toString()).toBe(DAI_HALF.toString())
    })

    it('should convert to JSON', () => {
        const args = new InvalidateTokenOut1DArgs(DAI_HALF)
        const json = args.toJSON()

        expect(json).toEqual({
            tokenOut: DAI_HALF.toString()
        })
    })

    it('should handle different tokens', () => {
        const args = new InvalidateTokenOut1DArgs(LINK_HALF)
        const encoded = coder.encode(args)
        const decoded = coder.decode(encoded)

        expect(decoded.tokenOutHalf.toString()).toBe(LINK_HALF.toString())
    })
})
