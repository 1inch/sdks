// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString, Address } from '@1inch/sdk-core'
import { JumpIfTokenArgsCoder } from './jump-if-token-args-coder'
import type { IArgsCoder, IArgsData } from '../types'

/**
 * Arguments for jumpIfTokenIn and jumpIfTokenOut instructions.
 * Encoded as `20-byte token address | uint16 nextPC`
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Controls.sol#L25
 **/
export class JumpIfTokenArgs implements IArgsData {
  public static readonly CODER: IArgsCoder<JumpIfTokenArgs> = new JumpIfTokenArgsCoder()

  constructor(
    public readonly token: Address,
    public readonly nextPC: bigint,
  ) {}

  static decode(data: HexString): JumpIfTokenArgs {
    return JumpIfTokenArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      token: this.token.toString(),
      nextPC: this.nextPC,
    }
  }
}
