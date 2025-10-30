import {describe, it, expect} from 'vitest'
import {Address, AddressHalf} from '@1inch/sdk-shared'
import * as balances from '../instructions/balances'
import * as controls from '../instructions/controls'
import {RegularProgramBuilder} from './'

describe('ProgramBuilder', () => {
    const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
    const DAI = new Address('0x6B175474E89094C44Da98b954EedeAC495271d0F')
    const LINK = new Address('0x514910771AF9Ca656af840dff83E8264EcF986CA')

    const LINK_HALF = AddressHalf.fromAddress(LINK)
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

    it('should handle complex control flow operations', () => {
        const originalBuilder = new RegularProgramBuilder()

        const program = originalBuilder
            .salt({salt: 5n})
            .onlyTakerTokenBalanceNonZero({token: WETH})
            .onlyTakerTokenBalanceGte({
                token: USDC,
                minAmount: 1000n * 10n ** 6n
            })
            .jumpIfExactIn({nextPC: 10n})
            .onlyTakerTokenSupplyShareGte({
                token: DAI,
                minShareE18: 10n ** 15n // 0.001 (0.1% of supply)
            })
            .jump({nextPC: 20n})
            .build()

        const decodedBuilder = RegularProgramBuilder.decode(program)
        const decodedProgram = decodedBuilder.build()
        expect(decodedProgram.toString()).toBe(program.toString())

        const ixs = decodedBuilder.getInstructions()
        expect(ixs).toHaveLength(6)

        expect(ixs[0].opcode.id.toString()).toContain('salt')
        expect((ixs[0].args as controls.SaltArgs).salt).toBe(5n)

        expect(ixs[1].opcode.id.toString()).toContain(
            'onlyTakerTokenBalanceNonZero'
        )
        expect(
            (
                ixs[1].args as controls.OnlyTakerTokenBalanceNonZeroArgs
            ).token.toString()
        ).toBe(WETH.toString())

        expect(ixs[2].opcode.id.toString()).toContain(
            'onlyTakerTokenBalanceGte'
        )
        const balanceGteArgs = ixs[2]
            .args as controls.OnlyTakerTokenBalanceGteArgs
        expect(balanceGteArgs.token.toString()).toBe(USDC.toString())
        expect(balanceGteArgs.minAmount).toBe(1000n * 10n ** 6n)

        expect(ixs[3].opcode.id.toString()).toContain('jumpIfExactIn')
        expect((ixs[3].args as controls.JumpArgs).nextPC).toBe(10n)

        expect(ixs[4].opcode.id.toString()).toContain(
            'onlyTakerTokenSupplyShareGte'
        )
        const supplyShareArgs = ixs[4]
            .args as controls.OnlyTakerTokenSupplyShareGteArgs
        expect(supplyShareArgs.token.toString()).toBe(DAI.toString())
        expect(supplyShareArgs.minShareE18).toBe(10n ** 15n)

        expect(ixs[5].opcode.id.toString()).toContain('jump')
        expect((ixs[5].args as controls.JumpArgs).nextPC).toBe(20n)
    })

    it('should combine balances and control instructions', () => {
        const originalBuilder = new RegularProgramBuilder()

        const program = originalBuilder
            .salt({salt: 5n})
            .setBalancesXD({
                tokenBalances: [
                    {tokenHalf: USDC_HALF, value: 5000n * 10n ** 6n},
                    {tokenHalf: WETH_HALF, value: 2n * 10n ** 18n},
                    {tokenHalf: LINK_HALF, value: 100n * 10n ** 18n}
                ]
            })
            .onlyTakerTokenBalanceGte({
                token: USDC,
                minAmount: 100n * 10n ** 6n
            })
            .jumpIfExactOut({nextPC: 15n})
            .balancesXD({
                tokenBalances: [{tokenHalf: WETH_HALF, value: 10n ** 18n}]
            })
            .onlyTakerTokenSupplyShareGte({
                token: LINK,
                minShareE18: 5n * 10n ** 14n // 0.0005 (0.05% of supply)
            })
            .jump({nextPC: 25n})
            .build()

        const decodedBuilder = RegularProgramBuilder.decode(program)
        const decodedProgram = decodedBuilder.build()
        expect(decodedProgram.toString()).toBe(program.toString())

        const ixs = decodedBuilder.getInstructions()
        expect(ixs).toHaveLength(7)

        expect(ixs[0].opcode.id.toString()).toContain('salt')
        expect((ixs[0].args as controls.SaltArgs).salt).toBe(5n)

        expect(ixs[1].opcode.id.toString()).toContain('setBalancesXD')
        const setBalancesArgs = ixs[1].args as balances.BalancesArgs
        expect(setBalancesArgs.tokenBalances).toHaveLength(3)
        expect(setBalancesArgs.tokenBalances[0].value).toBe(5000n * 10n ** 6n)
        expect(setBalancesArgs.tokenBalances[1].value).toBe(2n * 10n ** 18n)
        expect(setBalancesArgs.tokenBalances[2].value).toBe(100n * 10n ** 18n)

        expect(ixs[2].opcode.id.toString()).toContain(
            'onlyTakerTokenBalanceGte'
        )
        const balanceCheck = ixs[2]
            .args as controls.OnlyTakerTokenBalanceGteArgs
        expect(balanceCheck.token.toString()).toBe(USDC.toString())
        expect(balanceCheck.minAmount).toBe(100n * 10n ** 6n)

        expect(ixs[3].opcode.id.toString()).toContain('jumpIfExactOut')
        expect((ixs[3].args as controls.JumpArgs).nextPC).toBe(15n)

        expect(ixs[4].opcode.id.toString()).toContain('balancesXD')
        const balancesArgs = ixs[4].args as balances.BalancesArgs
        expect(balancesArgs.tokenBalances).toHaveLength(1)
        expect(balancesArgs.tokenBalances[0].value).toBe(10n ** 18n)

        expect(ixs[5].opcode.id.toString()).toContain(
            'onlyTakerTokenSupplyShareGte'
        )
        const supplyShare = ixs[5]
            .args as controls.OnlyTakerTokenSupplyShareGteArgs
        expect(supplyShare.token.toString()).toBe(LINK.toString())
        expect(supplyShare.minShareE18).toBe(5n * 10n ** 14n)

        expect(ixs[6].opcode.id.toString()).toContain('jump')
        expect((ixs[6].args as controls.JumpArgs).nextPC).toBe(25n)
    })
})
