import { BytesBuilder, BytesIter } from '@1inch/byte-utils'
import { Address, HexString } from '@1inch/sdk-core'
import { OraclePriceAdjusterArgs } from './oracle-price-adjuster-args'
import type { IArgsCoder } from '../types'

export class OraclePriceAdjusterArgsCoder implements IArgsCoder<OraclePriceAdjusterArgs> {
  encode(args: OraclePriceAdjusterArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint64(args.maxPriceDecay)
    builder.addUint16(args.maxStaleness)
    builder.addUint8(args.oracleDecimals)
    builder.addAddress(args.oracleAddress.toString())

    return new HexString(builder.asHex())
  }

  decode(data: HexString): OraclePriceAdjusterArgs {
    const iter = BytesIter.HexString(data.toString())
    const maxPriceDecay = iter.nextUint64()
    const maxStaleness = iter.nextUint16()
    const oracleDecimals = iter.nextUint8()
    const oracleAddress = new Address(iter.nextAddress())

    return new OraclePriceAdjusterArgs(
      BigInt(maxPriceDecay),
      BigInt(maxStaleness),
      BigInt(oracleDecimals),
      oracleAddress,
    )
  }
}
