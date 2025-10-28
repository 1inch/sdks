import {decodeEventLog, Log} from 'viem'
import {Address, HexString} from '@1inch/sdk-shared'
import {EventAction} from '../types'
import AQUA_PROTOCOL_ABI from '../../abi/Aqua.abi.json' with {type: 'json'}

export class PushedEvent {
    public static TOPIC: HexString = new HexString(
        '0x3f18354abbd5306dd1665c2c90f614a4559e39dd620d04fbe5458e613b6588f3'
    )

    public static eventName = 'Pushed'

    private readonly action = EventAction.Pushed

    constructor(
        public readonly maker: Address,
        public readonly app: Address,
        public readonly strategyHash: HexString,
        public readonly token: Address,
        public readonly amount: bigint
    ) {}

    static fromLog(log: Log): PushedEvent {
        const decoded = decodeEventLog({
            abi: AQUA_PROTOCOL_ABI,
            data: log.data,
            topics: log.topics,
            eventName: PushedEvent.eventName
        })

        const args = decoded.args as unknown as {
            maker: string
            app: string
            strategyHash: string
            token: string
            amount: bigint
        }

        return new PushedEvent(
            new Address(args.maker),
            new Address(args.app),
            new HexString(args.strategyHash),
            new Address(args.token),
            args.amount
        )
    }
}
