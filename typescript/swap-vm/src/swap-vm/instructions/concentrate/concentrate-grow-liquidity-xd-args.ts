import {HexString} from '@1inch/sdk-shared'
import {ConcentrateGrowLiquidityXDArgsCoder} from './concentrate-grow-liquidity-xd-args-coder'
import {TokenDelta} from './types'
import {IArgsData} from '../types'

/**
 * Arguments for concentrateGrowLiquidityXD instruction with multiple token deltas
 * @see https://github.com/1inch/swap-vm-private/blob/f4ed8024b66bca1a19ec2bc6bb62fce04bc8eab4/src/instructions/Concentrate.sol#L101
 **/
export class ConcentrateGrowLiquidityXDArgs implements IArgsData {
    public static readonly CODER = new ConcentrateGrowLiquidityXDArgsCoder()

    constructor(public readonly tokenDeltas: TokenDelta[]) {}

    /**
     * Decodes hex data into ConcentrateGrowLiquidityXDArgs instance
     **/
    static decode(data: HexString): ConcentrateGrowLiquidityXDArgs {
        return ConcentrateGrowLiquidityXDArgs.CODER.decode(data)
    }

    toJSON(): Record<string, unknown> {
        return {
            tokenDeltas: this.tokenDeltas.map(({tokenHalf, delta}) => ({
                token: tokenHalf.toString(),
                delta: delta.toString()
            }))
        }
    }
}
