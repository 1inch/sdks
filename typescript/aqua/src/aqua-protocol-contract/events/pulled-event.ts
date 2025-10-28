import {decodeEventLog, Log} from 'viem'
import {Address, HexString} from '@1inch/sdk-shared'
import {EventAction} from '../types'
import AQUA_PROTOCOL_ABI from '../../abi/Aqua.abi.json' with {type: 'json'}

export class PulledEvent {
    public static TOPIC: HexString = new HexString(
        '0x3ad61047071575417c75e3311e5d46ff042e292b5dd8769ff18b4b254098ca7a'
    )

    public static eventName = 'Pulled'

    private readonly action = EventAction.Pulled

    constructor(
        public readonly maker: Address,
        public readonly app: Address,
        public readonly strategyHash: HexString,
        public readonly token: Address,
        public readonly amount: bigint
    ) {}

    static fromLog(log: Log): PulledEvent {
        const decoded = decodeEventLog({
            abi: AQUA_PROTOCOL_ABI,
            data: log.data,
            topics: log.topics,
            eventName: PulledEvent.eventName
        })

        const args = decoded.args as unknown as {
            maker: string
            app: string
            strategyHash: string
            token: string
            amount: bigint
        }

        return new PulledEvent(
            new Address(args.maker),
            new Address(args.app),
            new HexString(args.strategyHash),
            new Address(args.token),
            args.amount
        )
    }
}
