import {describe, it, expect} from 'vitest'
import {Address, AddressHalf} from '@1inch/sdk-shared'
import {balances} from '../instructions'
import {RegularProgramBuilder} from './'

describe('ProgramBuilder', () => {
    const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

    const USDC_HALF = AddressHalf.fromAddress(USDC)
    const WETH_HALF = AddressHalf.fromAddress(WETH)

    it('should encode and decode program correctly for REGULAR', () => {
        const originalBuilder = new RegularProgramBuilder()

        const program = originalBuilder
            .setBalancesXD({
                tokenBalances: [
                    {tokenHalf: USDC_HALF, value: 2000n * 10n ** 6n},
                    {tokenHalf: WETH_HALF, value: 1n * 10n ** 18n}
                ]
            })
            .build()
        const decodedBuilder = RegularProgramBuilder.decode(program)
        const decodedProgram = decodedBuilder.build()
        expect(decodedProgram.toString()).toBe(program.toString())

        const ixs = decodedBuilder.getInstructions()
        expect(ixs).toHaveLength(1)
        expect(ixs[0].opcode.id.toString()).toContain('setBalancesXD')
        expect(
            (ixs[0].args as balances.BalancesArgs).tokenBalances
        ).toHaveLength(2)
    })
})
