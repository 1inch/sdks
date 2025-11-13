import type { Address, HexString } from '@1inch/sdk-core'
import { OnlyTakerTokenBalanceNonZeroArgsCoder } from './only-taker-token-balance-non-zero-args-coder'
import type { IArgsData } from '../types'

/**
 * Arguments for checking if taker holds any amount of a token
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Controls.sol#L10
 **/
export class OnlyTakerTokenBalanceNonZeroArgs implements IArgsData {
  public static readonly CODER = new OnlyTakerTokenBalanceNonZeroArgsCoder()

  constructor(public readonly token: Address) {}

  /**
   * Decodes hex data into OnlyTakerTokenBalanceNonZeroArgs instance
   **/
  static decode(data: HexString): OnlyTakerTokenBalanceNonZeroArgs {
    return OnlyTakerTokenBalanceNonZeroArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      token: this.token.toString(),
    }
  }
}
