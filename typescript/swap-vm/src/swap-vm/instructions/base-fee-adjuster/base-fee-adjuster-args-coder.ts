import { BytesBuilder, BytesIter, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { BaseFeeAdjusterArgs } from './base-fee-adjuster-args'
import type { IArgsCoder } from '../types'

export class BaseFeeAdjusterArgsCoder implements IArgsCoder<BaseFeeAdjusterArgs> {
  encode(args: BaseFeeAdjusterArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint64(args.baseGasPrice)
    builder.addUint96(args.ethToToken1Price)
    builder.addUint24(args.gasAmount)
    builder.addUint64(args.maxPriceDecay)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): BaseFeeAdjusterArgs {
    const iter = BytesIter.BigInt(data.toString())
    const baseGasPrice = iter.nextUint64()
    const ethToToken1Price = iter.nextUint96()
    const gasAmount = iter.nextUint24()
    const maxPriceDecay = iter.nextUint64()

    return new BaseFeeAdjusterArgs(baseGasPrice, ethToToken1Price, gasAmount, maxPriceDecay)
  }
}
