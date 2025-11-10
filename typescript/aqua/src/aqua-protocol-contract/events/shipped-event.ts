import { decodeEventLog, Log } from 'viem'
import { Address, HexString } from '@1inch/sdk-core'
import { EventAction } from '../types'
import AQUA_PROTOCOL_ABI from '../../abi/Aqua.abi.json'

export class ShippedEvent {
  public static TOPIC: HexString = new HexString(
    '0xdc3622e06fb145651f567d421c9ef261d71d43e3778b761907bc0d70d42e52b0',
  )

  public static eventName = 'Shipped'

  private readonly action = EventAction.Shipped

  constructor(
    public readonly maker: Address,
    public readonly app: Address,
    public readonly strategyHash: HexString,
    public readonly strategy: HexString,
  ) {}

  /**
   * Creates a ShippedEvent from a Viem Log
   * @throws Error if the log data is invalid or doesn't match the expected event structure
   */
  static fromLog(log: Log): ShippedEvent {
    const decoded = decodeEventLog({
      abi: AQUA_PROTOCOL_ABI,
      data: log.data,
      topics: log.topics,
      eventName: ShippedEvent.eventName,
    })

    const { maker, app, strategyHash, strategy } = decoded.args as unknown as {
      maker: string
      app: string
      strategyHash: string
      strategy: string
    }

    return new ShippedEvent(
      new Address(maker),
      new Address(app),
      new HexString(strategyHash),
      new HexString(strategy),
    )
  }
}
