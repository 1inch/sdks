import {Address, HexString} from '@1inch/sdk-shared'
import {ConcentrateGrowLiquidity2DArgsCoder} from './concentrate-grow-liquidity-2d-args-coder'
import {IArgsData} from '../types'

/**
 * Arguments for concentrateGrowLiquidity2D instruction with two deltas
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Concentrate.sol#L153
 **/
export class ConcentrateGrowLiquidity2DArgs implements IArgsData {
    public static readonly CODER = new ConcentrateGrowLiquidity2DArgsCoder()

    constructor(
        public readonly deltaLt: bigint,
        public readonly deltaGt: bigint
    ) {}

    /**
     * Helper to create args from token addresses and deltas (handles ordering)
     **/
    static fromTokenDeltas(
        tokenA: Address,
        tokenB: Address,
        deltaA: bigint,
        deltaB: bigint
    ): ConcentrateGrowLiquidity2DArgs {
        const tokenABigInt = BigInt(tokenA.toString())
        const tokenBBigInt = BigInt(tokenB.toString())

        const [deltaLt, deltaGt] =
            tokenABigInt < tokenBBigInt ? [deltaA, deltaB] : [deltaB, deltaA]

        return new ConcentrateGrowLiquidity2DArgs(deltaLt, deltaGt)
    }

    /**
     * Decodes hex data into ConcentrateGrowLiquidity2DArgs instance
     **/
    static decode(data: HexString): ConcentrateGrowLiquidity2DArgs {
        return ConcentrateGrowLiquidity2DArgs.CODER.decode(data)
    }

    toJSON(): Record<string, unknown> {
        return {
            deltaLt: this.deltaLt.toString(),
            deltaGt: this.deltaGt.toString()
        }
    }
}
