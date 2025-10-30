import type {DataFor} from '@1inch/sdk-shared'
import {ProgramBuilder} from './program-builder'
import {SwapVmProgram} from './swap-vm-program'
import {aquaInstructions} from '../instructions'
import * as controls from '../instructions/controls'

export class AquaProgramBuilder extends ProgramBuilder {
    constructor() {
        super([...aquaInstructions])
    }

    static decode(program: SwapVmProgram): AquaProgramBuilder {
        return new AquaProgramBuilder().decode(program)
    }

    /**
     * Unconditional jump to specified program counter
     **/
    public jump(data: DataFor<controls.JumpArgs>): this {
        super.add(controls.jump.createIx(new controls.JumpArgs(data.nextPC)))

        return this
    }

    /**
     * Jump to specified program counter if swap mode is exact input
     **/
    public jumpIfExactIn(data: DataFor<controls.JumpArgs>): this {
        super.add(
            controls.jumpIfExactIn.createIx(new controls.JumpArgs(data.nextPC))
        )

        return this
    }

    /**
     * Jump to specified program counter if swap mode is exact output
     **/
    public jumpIfExactOut(data: DataFor<controls.JumpArgs>): this {
        super.add(
            controls.jumpIfExactOut.createIx(new controls.JumpArgs(data.nextPC))
        )

        return this
    }

    /**
     * Requires taker to hold any amount of specified token (supports NFTs)
     **/
    public onlyTakerTokenBalanceNonZero(
        data: DataFor<controls.OnlyTakerTokenBalanceNonZeroArgs>
    ): this {
        super.add(
            controls.onlyTakerTokenBalanceNonZero.createIx(
                new controls.OnlyTakerTokenBalanceNonZeroArgs(data.token)
            )
        )

        return this
    }

    /**
     * Requires taker to hold at least specified amount of token
     **/
    public onlyTakerTokenBalanceGte(
        data: DataFor<controls.OnlyTakerTokenBalanceGteArgs>
    ): this {
        super.add(
            controls.onlyTakerTokenBalanceGte.createIx(
                new controls.OnlyTakerTokenBalanceGteArgs(
                    data.token,
                    data.minAmount
                )
            )
        )

        return this
    }

    /**
     * Requires taker to hold at least specified share of token's total supply
     **/
    public onlyTakerTokenSupplyShareGte(
        data: DataFor<controls.OnlyTakerTokenSupplyShareGteArgs>
    ): this {
        super.add(
            controls.onlyTakerTokenSupplyShareGte.createIx(
                new controls.OnlyTakerTokenSupplyShareGteArgs(
                    data.token,
                    data.minShareE18
                )
            )
        )

        return this
    }

    /**
     * No-op instruction used to add uniqueness to order hashes (prevents replay attacks)
     **/
    public salt(data: DataFor<controls.SaltArgs>): this {
        super.add(controls.salt.createIx(new controls.SaltArgs(data.salt)))

        return this
    }
}
