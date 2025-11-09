import { Address, DataFor } from '@1inch/sdk-shared'
import { MakerTraits } from './maker-traits'
import { SwapVmProgram } from './programs/swap-vm-program'

export class Order {
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
}
