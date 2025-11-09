import {describe, it, expect} from 'vitest'
import {Address} from '@1inch/sdk-shared'
import {AquaAMMStrategy} from './aqua-amm-strategy'
import {AquaProgramBuilder} from '../programs/aqua-program-builder'

describe('AquaAMMStrategy', () => {
    const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

    describe('buildProgram', () => {
        it('should build minimal program with just xycSwap', () => {
            const program = AquaAMMStrategy.buildProgram({
                tokenA: USDC,
                tokenB: WETH
            })

            const decoded = AquaProgramBuilder.decode(program)
            const rebuilt = decoded.build()
            expect(rebuilt.toString()).toBe(program.toString())
            expect(program.toString()).toBe('0x1000')
        })

        it('should build with all parameters', () => {
            const program = AquaAMMStrategy.buildProgram({
                tokenA: USDC,
                tokenB: WETH,
                deltaA: 100000n,
                deltaB: 200000n,
                decayPeriod: 3600n,
                feeBpsIn: 30n,
                protocolFeeBpsIn: 10n,
                feeReceiver: new Address(
                    '0x0000000000000000000000000000000000000001'
                ),
                salt: 12345n
            })

            const decoded = AquaProgramBuilder.decode(program)
            const rebuilt = decoded.build()
            expect(rebuilt.toString()).toBe(program.toString())
        })

        it('should add concentrate when deltas are non-zero', () => {
            const program = AquaAMMStrategy.buildProgram({
                tokenA: USDC,
                tokenB: WETH,
                deltaA: 100000n,
                deltaB: 200000n
            })

            const decoded = AquaProgramBuilder.decode(program)
            const rebuilt = decoded.build()
            expect(rebuilt.toString()).toBe(program.toString())
            expect(program.toString().length).toBeGreaterThan(4)
        })

        it('should add decay when period is non-zero', () => {
            const program = AquaAMMStrategy.buildProgram({
                tokenA: USDC,
                tokenB: WETH,
                decayPeriod: 600n
            })

            const decoded = AquaProgramBuilder.decode(program)
            const rebuilt = decoded.build()
            expect(rebuilt.toString()).toBe(program.toString())
        })

        it('should add fee when feeBpsIn is non-zero', () => {
            const program = AquaAMMStrategy.buildProgram({
                tokenA: USDC,
                tokenB: WETH,
                feeBpsIn: 30n
            })

            const decoded = AquaProgramBuilder.decode(program)
            const rebuilt = decoded.build()
            expect(rebuilt.toString()).toBe(program.toString())
        })

        it('should add protocol fee when both fee and receiver provided', () => {
            const program = AquaAMMStrategy.buildProgram({
                tokenA: USDC,
                tokenB: WETH,
                protocolFeeBpsIn: 10n,
                feeReceiver: new Address(
                    '0x0000000000000000000000000000000000000001'
                )
            })

            const decoded = AquaProgramBuilder.decode(program)
            const rebuilt = decoded.build()
            expect(rebuilt.toString()).toBe(program.toString())
        })

        it('should NOT add protocol fee without receiver', () => {
            const program = AquaAMMStrategy.buildProgram({
                tokenA: USDC,
                tokenB: WETH,
                protocolFeeBpsIn: 10n
            })

            expect(program.toString()).toBe('0x1000')
        })

        it('should add salt when non-zero', () => {
            const program = AquaAMMStrategy.buildProgram({
                tokenA: USDC,
                tokenB: WETH,
                salt: 12345n
            })

            const decoded = AquaProgramBuilder.decode(program)
            const rebuilt = decoded.build()
            expect(rebuilt.toString()).toBe(program.toString())
        })

        it('should handle token ordering for concentrate', () => {
            const program1 = AquaAMMStrategy.buildProgram({
                tokenA: USDC,
                tokenB: WETH,
                deltaA: 100000n,
                deltaB: 200000n
            })

            const program2 = AquaAMMStrategy.buildProgram({
                tokenA: WETH,
                tokenB: USDC,
                deltaA: 200000n,
                deltaB: 100000n
            })

            const decoded1 = AquaProgramBuilder.decode(program1)
            const decoded2 = AquaProgramBuilder.decode(program2)
            expect(decoded1.build).toBeDefined()
            expect(decoded2.build).toBeDefined()
        })
    })
})
