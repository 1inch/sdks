// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address, HexString } from '@1inch/sdk-core'
import { DynamicProtocolFeeArgsCoder } from './dynamic-protocol-fee-args-coder'
import type { IArgsCoder, IArgsData } from '../../types'

/**
 * Arguments for dynamic protocol fee instructions (dynamicProtocolFeeAmountInXD, aquaDynamicProtocolFeeAmountInXD).
 * A zero `feeProvider` is valid and disables the fee: the provider call is skipped and no fee is charged.
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol
 **/
export class DynamicProtocolFeeArgs implements IArgsData {
  public static readonly CODER: IArgsCoder<DynamicProtocolFeeArgs> =
    new DynamicProtocolFeeArgsCoder()

  /**
   * feeProvider - address of the IProtocolFeeProvider contract (20 bytes), zero address disables the fee
   **/
  constructor(public readonly feeProvider: Address) {}

  static decode(data: HexString): DynamicProtocolFeeArgs {
    return DynamicProtocolFeeArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      feeProvider: this.feeProvider.toString(),
    }
  }
}
