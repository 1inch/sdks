// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { Address } from '@1inch/sdk-core'
import type { TokenReserveArgs, TokenReserveJSON } from './types'

export class TokenReserve {
  constructor(
    public readonly token: Address,
    public readonly reserve: bigint,
  ) {}

  static new(args: TokenReserveArgs): TokenReserve {
    return new TokenReserve(args.token, args.reserve)
  }

  static fromJSON(input: TokenReserveJSON): TokenReserve {
    return new TokenReserve(new Address(input.token), BigInt(input.reserve))
  }

  toJSON(): TokenReserveJSON {
    return {
      token: this.token.toString(),
      reserve: this.reserve.toString(),
    }
  }
}
