import {decodeEventLog, Log} from 'viem'
import {Address, HexString} from '@1inch/sdk-shared'
import SWAP_VM_ABI from '../../abi/SwapVM.abi.json' with {type: 'json'}

export class SwappedEvent {
    public static TOPIC: HexString = new HexString(
        '0x54bc5c027d15d7aa8ae083f994ab4411d2f223291672ecd3a344f3d92dcaf8b2'
    )

    public static eventName = 'Swapped'

    constructor(
        public readonly orderHash: HexString,
        public readonly maker: Address,
        public readonly taker: Address,
        public readonly tokenIn: Address,
        public readonly tokenOut: Address,
        public readonly amountIn: bigint,
        public readonly amountOut: bigint
    ) {}

    static fromLog(log: Log): SwappedEvent {
        const decoded = decodeEventLog({
            abi: SWAP_VM_ABI,
            data: log.data,
            topics: log.topics,
            eventName: SwappedEvent.eventName
        })

        const {
            orderHash,
            maker,
            taker,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut
        } = decoded.args as unknown as {
            orderHash: string
            maker: string
            taker: string
            tokenIn: string
            tokenOut: string
            amountIn: bigint
            amountOut: bigint
        }

        return new SwappedEvent(
            new HexString(orderHash),
            new Address(maker),
            new Address(taker),
            new Address(tokenIn),
            new Address(tokenOut),
            amountIn,
            amountOut
        )
    }
}
