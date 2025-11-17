// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import type { LogLike } from '@1inch/sdk-core'
import { decodeEventLog } from 'viem'
import { Address, HexString } from '@1inch/sdk-core'
import { AQUA_ABI } from '../../abi/Aqua.abi'

export class ShippedEvent {
  public static TOPIC: HexString = new HexString(
    '0xdc3622e06fb145651f567d421c9ef261d71d43e3778b761907bc0d70d42e52b0',
  )

  constructor(
    public readonly maker: Address,
    public readonly app: Address,
    public readonly strategyHash: HexString,
    public readonly strategy: HexString,
  ) {}

  /**
   * Creates a ShippedEvent
   * @throws Error if the log data is invalid or doesn't match the expected event structure
   */
  static fromLog(log: LogLike): ShippedEvent {
    const decoded = decodeEventLog({
      abi: AQUA_ABI,
      data: log.data,
      topics: log.topics,
      eventName: 'Shipped',
    })

    const { maker, app, strategyHash, strategy } = decoded.args

    return new ShippedEvent(
      new Address(maker),
      new Address(app),
      new HexString(strategyHash),
      new HexString(strategy),
    )
  }
}
