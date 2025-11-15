import type { Address, DataFor, Hex, NetworkEnum } from '@1inch/sdk-core'
import { HexString } from '@1inch/sdk-core'
import { keccak256, encodeAbiParameters, hashTypedData } from 'viem'
import assert from 'assert'
import type { MakerTraits } from './maker-traits'
import type { SwapVmProgram } from './programs'

type BuiltOrder = {
  maker: Hex
  traits: bigint
  data: Hex
}

export class Order {
  static ABI = {
    type: 'tuple',
    components: [
      { name: 'maker', type: 'address' },
      { name: 'traits', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
  } as const

  constructor(
    public readonly maker: Address,
    public readonly traits: MakerTraits,
    public readonly program: SwapVmProgram,
  ) {}

  public static new(params: DataFor<Order>): Order {
    return new Order(params.maker, params.traits, params.program)
  }

  public hash(domain?: {
    chainId: NetworkEnum
    name: string
    verifyingContract: Address
    version: string
  }): HexString {
    if (this.traits.useAquaInsteadOfSignature) {
      return new HexString(keccak256(this.abiEncode().toString()))
    }

    assert(domain, 'domain info required if isUseOfAquaInsteadOfSignatureEnabled is false')

    return new HexString(
      hashTypedData({
        domain: {
          ...domain,
          verifyingContract: domain.verifyingContract.toString(),
        },
        primaryType: 'Order',
        types: {
          Order: [
            { name: 'maker', type: 'address' },
            { name: 'traits', type: 'uint256' },
            { name: 'data', type: 'bytes' },
          ],
        },
        message: this.build(),
      }),
    )
  }

  public abiEncode(): HexString {
    const encoded = encodeAbiParameters([Order.ABI], [this.build()])

    return new HexString(encoded)
  }

  public build(): BuiltOrder {
    const { traits, hooksData } = this.traits.encode(this.maker)

    return {
      maker: this.maker.toString(),
      traits,
      data: hooksData.concat(this.program).toString(),
    }
  }
}
