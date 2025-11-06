import {Address} from '@1inch/sdk-shared'
import {AquaProgramBuilder} from '../programs/aqua-program-builder'
import {SwapVmProgram} from '../programs'

/**
 * Aqua AMM Strategy builder that mirrors AquaAMM.sol
 * @see https://github.com/1inch/swap-vm/blob/main/src/strategies/AquaAMM.sol
 */
export class AquaAMMStrategy {
    /**
     * Build a program matching AquaAMM.sol buildProgram function
     */
    static buildProgram(params: {
        tokenA: Address
        tokenB: Address
        feeBpsIn?: bigint
        deltaA?: bigint
        deltaB?: bigint
        decayPeriod?: bigint
        protocolFeeBpsIn?: bigint
        feeReceiver?: Address
        salt?: bigint
    }): SwapVmProgram {
        const builder = new AquaProgramBuilder()

        if (
            (params.deltaA && params.deltaA > 0n) ||
            (params.deltaB && params.deltaB > 0n)
        ) {
            const tokenABigInt = BigInt(params.tokenA.toString())
            const tokenBBigInt = BigInt(params.tokenB.toString())
            const [deltaLt, deltaGt] =
                tokenABigInt < tokenBBigInt
                    ? [params.deltaA || 0n, params.deltaB || 0n]
                    : [params.deltaB || 0n, params.deltaA || 0n]

            builder.concentrateGrowLiquidity2D({deltaLt, deltaGt})
        }

        if (params.decayPeriod && params.decayPeriod > 0n) {
            builder.decayXD({decayPeriod: params.decayPeriod})
        }

        if (params.feeBpsIn && params.feeBpsIn > 0n) {
            builder.flatFeeAmountInXD({fee: params.feeBpsIn})
        }

        if (
            params.protocolFeeBpsIn &&
            params.protocolFeeBpsIn > 0n &&
            params.feeReceiver
        ) {
            builder.aquaProtocolFeeAmountOutXD({
                fee: params.protocolFeeBpsIn,
                to: params.feeReceiver
            })
        }

        builder.xycSwapXD()

        if (params.salt && params.salt > 0n) {
            builder.salt({salt: params.salt})
        }

        return builder.build()
    }
}
