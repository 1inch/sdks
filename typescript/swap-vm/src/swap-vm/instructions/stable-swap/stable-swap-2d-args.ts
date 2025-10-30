import {Address, HexString} from '@1inch/sdk-shared'
import {UINT_32_MAX} from '@1inch/byte-utils'
import assert from 'node:assert'
import {StableSwap2DArgsCoder} from './stable-swap-2d-args-coder'
import {IArgsData} from '../types'

/**
 * Arguments for stableSwap2D instruction for stablecoin optimized swaps
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/StableSwap.sol#L45
 **/
export class StableSwap2DArgs implements IArgsData {
    public static readonly CODER = new StableSwap2DArgsCoder()

    /**
     * fee - swap fee in 1e10 (uint32)
     * A - amplification coefficient (uint32)
     * rateLt - rate for token with lower address (uint256)
     * rateGt - rate for token with higher address (uint256)
     **/
    constructor(
        public readonly fee: bigint,
        public readonly A: bigint,
        public readonly rateLt: bigint,
        public readonly rateGt: bigint
    ) {
        assert(fee >= 0n && fee <= UINT_32_MAX, `Invalid fee: ${fee}`)
        assert(A >= 0n && A <= UINT_32_MAX, `Invalid A: ${A}`)
        assert(rateLt > 0n, 'rateLt must be positive')
        assert(rateGt > 0n, 'rateGt must be positive')
    }

    static fromTokens(
        fee: bigint,
        a: bigint,
        tokenA: Address,
        tokenB: Address,
        rateA: bigint,
        rateB: bigint
    ): StableSwap2DArgs {
        if (BigInt(tokenA.toString()) < BigInt(tokenB.toString())) {
            return new StableSwap2DArgs(fee, a, rateA, rateB)
        }

        return new StableSwap2DArgs(fee, a, rateB, rateA)
    }

    /**
     * Decodes hex data into StableSwap2DArgs instance
     **/
    static decode(data: HexString): StableSwap2DArgs {
        return StableSwap2DArgs.CODER.decode(data)
    }

    toJSON(): Record<string, unknown> {
        return {
            fee: this.fee.toString(),
            A: this.A.toString(),
            rateLt: this.rateLt.toString(),
            rateGt: this.rateGt.toString()
        }
    }
}
