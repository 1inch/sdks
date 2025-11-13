import type { AddressHalf, HexString } from '@1inch/sdk-core'
import { InvalidateTokenOut1DArgsCoder } from './invalidate-token-out-1d-args-coder'
import type { IArgsData } from '../types'

/**
 * Arguments for invalidateTokenOut1D instruction to invalidate by token output
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Invalidators.sol#L103
 **/
export class InvalidateTokenOut1DArgs implements IArgsData {
  public static readonly CODER = new InvalidateTokenOut1DArgsCoder()

  constructor(public readonly tokenOutHalf: AddressHalf) {}

  /**
   * Decodes hex data into InvalidateTokenOut1DArgs instance
   **/
  static decode(data: HexString): InvalidateTokenOut1DArgs {
    return InvalidateTokenOut1DArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      tokenOut: this.tokenOutHalf.toString(),
    }
  }
}
