import type { Address, DataFor, NetworkEnum } from '@1inch/sdk-core'
import { HexString } from '@1inch/sdk-core'
import { keccak256, encodeAbiParameters, hashTypedData } from 'viem'
import assert from 'assert'
import type { MakerTraits } from './maker-traits'
import { MakerData } from './maker-data'
import type { MakerDataArgs } from './types'

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
    public readonly data: HexString,
  ) {}

  public static new(params: DataFor<Order>): Order {
    return new Order(params.maker, params.traits, params.data)
  }

  public static build(
    maker: Address,
    traits: MakerTraits,
    data: MakerDataArgs = MakerData.EMPTY,
  ): Order {
    const encoded = MakerData.encode(data, maker)

    traits.withOrderDataOffsets(encoded.offsets)

    if (encoded.hasPreTransferInTarget) {
      traits.enablePreTransferInTarget()
    }

    if (encoded.hasPostTransferInTarget) {
      traits.enablePostTransferInTarget()
    }

    if (encoded.hasPreTransferOutTarget) {
      traits.enablePreTransferOutTarget()
    }

    if (encoded.hasPostTransferOutTarget) {
      traits.enablePostTransferOutTarget()
    }

    return new Order(maker, traits, encoded.data)
  }

  public hash(domain?: {
    chainId: NetworkEnum
    name: string
    verifyingContract: Address
    version: string
  }): HexString {
    if (this.traits.isUseOfAquaInsteadOfSignatureEnabled()) {
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
        message: {
          maker: this.maker.toString(),
          traits: this.traits.asBigInt(),
          data: this.data.toString(),
        },
      }),
    )
  }

  public abiEncode(): HexString {
    const encoded = encodeAbiParameters(
      [Order.ABI],
      [
        {
          maker: this.maker.toString(),
          traits: this.traits.asBigInt(),
          data: this.data.toString(),
        },
      ],
    )

    return new HexString(encoded)
  }
}
