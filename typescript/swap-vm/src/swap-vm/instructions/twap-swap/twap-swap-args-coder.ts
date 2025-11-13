import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { TWAPSwapArgs } from './twap-swap-args'
import type { IArgsCoder } from '../types'

export class TWAPSwapArgsCoder implements IArgsCoder<TWAPSwapArgs> {
  encode(args: TWAPSwapArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint256(args.balanceIn)
    builder.addUint256(args.balanceOut)
    builder.addUint256(args.startTime)
    builder.addUint256(args.duration)
    builder.addUint256(args.priceBumpAfterIlliquidity)
    builder.addUint256(args.minTradeAmountOut)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): TWAPSwapArgs {
    const iter = BytesIter.BigInt(data.toString())
    const balanceIn = iter.nextUint256()
    const balanceOut = iter.nextUint256()
    const startTime = iter.nextUint256()
    const duration = iter.nextUint256()
    const priceBumpAfterIlliquidity = iter.nextUint256()
    const minTradeAmountOut = iter.nextUint256()

    return new TWAPSwapArgs(
      balanceIn,
      balanceOut,
      startTime,
      duration,
      priceBumpAfterIlliquidity,
      minTradeAmountOut,
    )
  }
}
