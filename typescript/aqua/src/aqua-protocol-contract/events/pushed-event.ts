// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import type { LogLike } from '@1inch/sdk-core'
import { decodeEventLog } from 'viem'
import { Address, HexString } from '@1inch/sdk-core'
import { AQUA_ABI } from '../../abi/Aqua.abi'

export class PushedEvent {
  public static TOPIC: HexString = new HexString(
    '0x3f18354abbd5306dd1665c2c90f614a4559e39dd620d04fbe5458e613b6588f3',
  )

  constructor(
    public readonly maker: Address,
    public readonly app: Address,
    public readonly strategyHash: HexString,
    public readonly token: Address,
    public readonly amount: bigint,
  ) {}

  /**
   * Creates a PushedEvent
   * @throws Error if the log data is invalid or doesn't match the expected event structure
   */
  static fromLog(log: LogLike): PushedEvent {
    const decoded = decodeEventLog({
      abi: AQUA_ABI,
      data: log.data,
      topics: log.topics,
      eventName: 'Pushed',
    })

    const args = decoded.args

    return new PushedEvent(
      new Address(args.maker),
      new Address(args.app),
      new HexString(args.strategyHash),
      new Address(args.token),
      args.amount,
    )
  }
}
