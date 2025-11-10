import { Address, DataFor, HexString, NetworkEnum } from '@1inch/sdk-core'
import { keccak256, encodeAbiParameters, hashTypedData } from 'viem'
import { MakerTraits } from './maker-traits'
import { SwapVmProgram } from './programs/swap-vm-program'

export class Order {
  static ABI = {
    type: 'tuple',
    components: [
      { name: 'maker', type: 'address' },
      { name: 'traits', type: 'uint256' },
      { name: 'program', type: 'bytes' },
    ],
  } as const

  constructor(
    public readonly maker: Address,
    public readonly traits: MakerTraits,
    /**
     * List of instructions to be executed (8 bit index, 8 bit args length, args)
     */
    public readonly program: SwapVmProgram,
  ) {}

  public static new(data: DataFor<Order>): Order {
    return new Order(data.maker, data.traits, data.program)
  }

  public hash(domain: {
    chainId: NetworkEnum
    name: string
    verifyingContract: Address
    version: string
  }): HexString {
    if (this.traits.isUseOfAquaInsteadOfSignatureEnabled()) {
      return new HexString(keccak256(this.abiEncode().toString()))
    }

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
            { name: 'program', type: 'bytes' },
          ],
        },
        message: {
          maker: this.maker.toString(),
          traits: this.traits.asBigInt(),
          program: this.program.toString(),
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
          program: this.program.toString(),
        },
      ],
    )

    return new HexString(encoded)
  }
}
