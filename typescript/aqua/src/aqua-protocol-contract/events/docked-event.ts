import {decodeEventLog, Log} from 'viem'
import {Address, HexString} from '@1inch/sdk-shared'
import {EventAction} from '../types'
import AQUA_PROTOCOL_ABI from '../../abi/Aqua.abi.json' with {type: 'json'}

export class DockedEvent {
    public static TOPIC: HexString = new HexString(
        '0xd173a1d140c154eb1ce9298d251d5eb8c4089cc2d16e70f1067bdc810c6fe004'
    )

    public static eventName = 'Docked'

    private readonly action = EventAction.Docked

    constructor(
        public readonly maker: Address,
        public readonly app: Address,
        public readonly strategyHash: HexString
    ) {}

    static fromLog(log: Log): DockedEvent {
        const decoded = decodeEventLog({
            abi: AQUA_PROTOCOL_ABI,
            data: log.data,
            topics: log.topics,
            eventName: DockedEvent.eventName
        })

        const args = decoded.args as unknown as {
            maker: string
            app: string
            strategyHash: string
        }

        return new DockedEvent(
            new Address(args.maker),
            new Address(args.app),
            new HexString(args.strategyHash)
        )
    }
}
