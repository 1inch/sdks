import { decodeEventLog, Log } from 'viem'
import { Address, DataFor, HexString } from '@1inch/sdk-shared'
import { SWAP_VM_ABI } from '../../abi/SwapVM.abi'

export class SwappedEvent {
  public static TOPIC: HexString = new HexString(
    '0x54bc5c027d15d7aa8ae083f994ab4411d2f223291672ecd3a344f3d92dcaf8b2',
  )

  public static eventName = 'Swapped' as const

  constructor(
    public readonly orderHash: HexString,
    public readonly maker: Address,
    public readonly taker: Address,
    public readonly tokenIn: Address,
    public readonly tokenOut: Address,
    public readonly amountIn: bigint,
    public readonly amountOut: bigint,
  ) {}

  static new(data: DataFor<SwappedEvent>): SwappedEvent {
    return new SwappedEvent(
      data.orderHash,
      data.maker,
      data.taker,
      data.tokenIn,
      data.tokenOut,
      data.amountIn,
      data.amountOut,
    )
  }

  static fromLog(log: Log): SwappedEvent {
    const decoded = decodeEventLog({
      abi: SWAP_VM_ABI,
      data: log.data,
      topics: log.topics,
      eventName: SwappedEvent.eventName,
    })

    const { orderHash, maker, taker, tokenIn, tokenOut, amountIn, amountOut } = decoded.args

    return new SwappedEvent(
      new HexString(orderHash),
      new Address(maker),
      new Address(taker),
      new Address(tokenIn),
      new Address(tokenOut),
      amountIn,
      amountOut,
    )
  }
}
