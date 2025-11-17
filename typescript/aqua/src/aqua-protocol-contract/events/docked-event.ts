// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { decodeEventLog } from 'viem'
import { Address, HexString } from '@1inch/sdk-core'
import type { LogLike } from '@1inch/sdk-core'
import { AQUA_ABI } from '../../abi/Aqua.abi'

export class DockedEvent {
  public static TOPIC: HexString = new HexString(
    '0xd173a1d140c154eb1ce9298d251d5eb8c4089cc2d16e70f1067bdc810c6fe004',
  )

  constructor(
    public readonly maker: Address,
    public readonly app: Address,
    public readonly strategyHash: HexString,
  ) {}

  /**
   * Creates a DockedEvent from
   * @throws Error if the log data is invalid or doesn't match the expected event structure
   */
  static fromLog(log: LogLike): DockedEvent {
    const decoded = decodeEventLog({
      abi: AQUA_ABI,
      data: log.data,
      topics: log.topics,
      eventName: 'Docked',
    })

    const args = decoded.args

    return new DockedEvent(
      new Address(args.maker),
      new Address(args.app),
      new HexString(args.strategyHash),
    )
  }
}
