import {describe, it, expect} from 'vitest'
import {Address, AddressHalf} from '@1inch/sdk-shared'
import {SwapVmProgram} from '@1inch/swap-vm-sdk'
import {RegularProgramBuilder} from './regular-program-builder'
import * as balances from '../instructions/balances'
import * as controls from '../instructions/controls'

describe('Cross-validation with Solidity', () => {
    it('should match Solidity test_PartialFillLimitOrder structure', () => {
        /*
         * @see https://github.com/1inch/swap-vm-private/blob/5127474d61f82cd886095c86b6c6a5e06ef895b4/test/SwapVM.t.sol#L72-L87
         **/
        const tokenA = new Address('0x1111111111111111111111111111111111111111')
        const tokenB = new Address('0x2222222222222222222222222222222222222222')

        const makerBalanceA = 100n * 10n ** 18n
        const makerBalanceB = 200n * 10n ** 18n

        const program = new RegularProgramBuilder()
            .setBalancesXD({
                tokenBalances: [
                    {
                        tokenHalf: AddressHalf.fromAddress(tokenA),
                        value: makerBalanceA
                    },
                    {
                        tokenHalf: AddressHalf.fromAddress(tokenB),
                        value: makerBalanceB
                    }
                ]
            })
            .limitSwap1D({
                makerDirectionLt: true // tokenB < tokenA (selling tokenA for tokenB)
            })
            .invalidateTokenOut1D({
                tokenOutHalf: AddressHalf.fromAddress(tokenA)
            })
            .salt({salt: 0x1235n})
            .build()

        const decoded = RegularProgramBuilder.decode(program)
        const instructions = decoded.getInstructions()

        expect(instructions).toHaveLength(4)

        expect(instructions[0].opcode.id.toString()).toContain('setBalancesXD')
        expect(instructions[1].opcode.id.toString()).toContain('limitSwap1D')
        expect(instructions[2].opcode.id.toString()).toContain(
            'invalidateTokenOut1D'
        )
        expect(instructions[3].opcode.id.toString()).toContain('salt')

        const balancesArgs = instructions[0].args as balances.BalancesArgs
        expect(balancesArgs.tokenBalances).toHaveLength(2)
        expect(balancesArgs.tokenBalances[0].value).toBe(makerBalanceA)
        expect(balancesArgs.tokenBalances[1].value).toBe(makerBalanceB)

        const saltArgs = instructions[3].args as controls.SaltArgs
        expect(saltArgs.salt).toBe(0x1235n)
    })

    it('should encode MinRate instruction correctly for Solidity', () => {
        const program = new RegularProgramBuilder()
            .requireMinRate1D({
                rateLt: 3000n,
                rateGt: 1n
            })
            .build()

        const decoded = RegularProgramBuilder.decode(program)
        const instructions = decoded.getInstructions()

        expect(instructions).toHaveLength(1)
        expect(instructions[0].opcode.id.toString()).toContain(
            'requireMinRate1D'
        )

        const hex = program.toString()

        const hexBytes = hex.slice(2)
        expect(hexBytes.slice(0, 2)).toBe('1b')
        expect(hexBytes.slice(2, 4)).toBe('10')
        expect(hexBytes.slice(4, 20)).toBe('0000000000000bb8')
        expect(hexBytes.slice(20, 36)).toBe('0000000000000001')
    })

    it('should produce correct encoding for complex program', () => {
        const tokenA = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
        const tokenB = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

        const program = new RegularProgramBuilder()
            .setBalancesXD({
                tokenBalances: [
                    {
                        tokenHalf: AddressHalf.fromAddress(tokenA),
                        value: 1000000n * 10n ** 6n
                    },
                    {
                        tokenHalf: AddressHalf.fromAddress(tokenB),
                        value: 500n * 10n ** 18n
                    }
                ]
            })
            .limitSwap1D({makerDirectionLt: false})
            .requireMinRate1D({rateLt: 2000n * 10n ** 6n, rateGt: 10n ** 18n})
            .invalidateTokenOut1D({
                tokenOutHalf: AddressHalf.fromAddress(tokenB)
            })
            .salt({salt: 0xdeadbeefn})
            .build()

        const decoded = RegularProgramBuilder.decode(program)
        const instructions = decoded.getInstructions()

        expect(instructions).toHaveLength(5)

        expect(instructions[0].opcode.id.toString()).toContain('setBalancesXD')
        expect(instructions[1].opcode.id.toString()).toContain('limitSwap1D')
        expect(instructions[2].opcode.id.toString()).toContain(
            'requireMinRate1D'
        )
        expect(instructions[3].opcode.id.toString()).toContain(
            'invalidateTokenOut1D'
        )
        expect(instructions[4].opcode.id.toString()).toContain('salt')

        const rebuilt = decoded.build()
        expect(rebuilt.toString()).toBe(program.toString())
    })

    it('should match exact hex from test_LimitSwapWithTokenOutInvalidator', () => {
        // Exact hex from Solidity test
        const SOLIDITY_HEX =
            '0x1056000296098f7c7019b51a820aec51e99254cd3fb576a90000000000000000000000000000000000000000000000056bc75e2d6310000000000000000000000000000000000000000000000000000ad78ebc5ac6200000190101140a96098f7c7019b51a820a24080000000000001235'

        const decoded = RegularProgramBuilder.decode(
            new SwapVmProgram(SOLIDITY_HEX)
        )
        const rebuilt = decoded.build()

        expect(rebuilt.toString().toLowerCase()).toBe(
            SOLIDITY_HEX.toLowerCase()
        )
    })

    it('should match exact hex from test_LimitSwapWithoutInvalidator_ReusableOrder', () => {
        // Exact hex from Solidity test
        const SOLIDITY_HEX =
            '0x1056000296098f7c7019b51a820aec51e99254cd3fb576a90000000000000000000000000000000000000000000000056bc75e2d6310000000000000000000000000000000000000000000000000000ad78ebc5ac6200000190101'

        // Decode and rebuild should produce identical hex
        const decoded = RegularProgramBuilder.decode(
            new SwapVmProgram(SOLIDITY_HEX)
        )
        const rebuilt = decoded.build()

        expect(rebuilt.toString().toLowerCase()).toBe(
            SOLIDITY_HEX.toLowerCase()
        )
    })
})
