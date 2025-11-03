import {describe, it, expect} from 'vitest'
import {Address} from '@1inch/sdk-shared'
import {AquaAMMStrategy} from './aqua-amm-strategy'
import {AquaProgramBuilder} from '../programs/aqua-program-builder'

describe('AquaAMMStrategy Examples', () => {
    const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

    it('Example: Minimal AMM', () => {
        const program = AquaAMMStrategy.buildProgram({
            tokenA: USDC,
            tokenB: WETH
        })

        expect(program.toString()).toBe('0x1000')
    })

    it('Example: AMM with fee', () => {
        const program = AquaAMMStrategy.buildProgram({
            tokenA: USDC,
            tokenB: WETH,
            feeBpsIn: 30n
        })

        const hex = program.toString()
        expect(hex).toContain('17')
        expect(hex).toContain('10')
    })

    it('Example: Concentrated liquidity', () => {
        const program = AquaAMMStrategy.buildProgram({
            tokenA: USDC,
            tokenB: WETH,
            deltaA: 100000n,
            deltaB: 200000n,
            feeBpsIn: 5n
        })

        const decoded = AquaProgramBuilder.decode(program)
        expect(decoded.build().toString()).toBe(program.toString())
    })

    it('Example: MEV-protected with decay', () => {
        const program = AquaAMMStrategy.buildProgram({
            tokenA: USDC,
            tokenB: WETH,
            decayPeriod: 600n,
            feeBpsIn: 30n
        })

        const decoded = AquaProgramBuilder.decode(program)
        expect(decoded.build().toString()).toBe(program.toString())
    })

    it('Example: Full configuration', () => {
        const program = AquaAMMStrategy.buildProgram({
            tokenA: USDC,
            tokenB: WETH,
            feeBpsIn: 30n,
            deltaA: 50000n,
            deltaB: 100000n,
            decayPeriod: 3600n,
            protocolFeeBpsIn: 10n,
            feeReceiver: new Address(
                '0x0000000000000000000000000000000000000001'
            ),
            salt: 12345n
        })

        const decoded = AquaProgramBuilder.decode(program)
        expect(decoded.build().toString()).toBe(program.toString())
    })
})
