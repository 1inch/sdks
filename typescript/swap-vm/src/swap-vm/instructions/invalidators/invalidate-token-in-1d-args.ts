import type { AddressHalf, HexString } from '@1inch/sdk-core'
import { InvalidateTokenIn1DArgsCoder } from './invalidate-token-in-1d-args-coder'
import type { IArgsData } from '../types'

/**
 * Arguments for invalidateTokenIn1D instruction to invalidate by token input
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Invalidators.sol#L85
 **/
export class InvalidateTokenIn1DArgs implements IArgsData {
  public static readonly CODER = new InvalidateTokenIn1DArgsCoder()

  constructor(public readonly tokenInHalf: AddressHalf) {}

  /**
   * Decodes hex data into InvalidateTokenIn1DArgs instance
   **/
  static decode(data: HexString): InvalidateTokenIn1DArgs {
    return InvalidateTokenIn1DArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      tokenIn: this.tokenInHalf.toString(),
    }
  }
}
