// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { decodeEventLog } from 'viem'
import { Address, HexString } from '@1inch/sdk-core'
import type { LogLike } from '@1inch/sdk-core'
import { AQUA_ABI } from '../../abi/Aqua.abi'

export class PulledEvent {
  public static TOPIC: HexString = new HexString(
    '0x3ad61047071575417c75e3311e5d46ff042e292b5dd8769ff18b4b254098ca7a',
  )

  constructor(
    public readonly maker: Address,
    public readonly app: Address,
    public readonly strategyHash: HexString,
    public readonly token: Address,
    public readonly amount: bigint,
  ) {}

  /**
   * Creates a PulledEvent
   * @throws Error if the log data is invalid or doesn't match the expected event structure
   */
  static fromLog(log: LogLike): PulledEvent {
    const decoded = decodeEventLog({
      abi: AQUA_ABI,
      data: log.data,
      topics: log.topics,
      eventName: 'Pulled',
    })

    const args = decoded.args

    return new PulledEvent(
      new Address(args.maker),
      new Address(args.app),
      new HexString(args.strategyHash),
      new Address(args.token),
      args.amount,
    )
  }
}
