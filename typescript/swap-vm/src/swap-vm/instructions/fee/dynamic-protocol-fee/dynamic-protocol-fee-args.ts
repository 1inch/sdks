// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address, HexString } from '@1inch/sdk-core'
import assert from 'assert'
import { DynamicProtocolFeeArgsCoder } from './dynamic-protocol-fee-args-coder'
import type { IArgsData } from '../../types'

/**
 * Arguments for dynamic protocol fee instructions (dynamicProtocolFeeAmountInXD, aquaDynamicProtocolFeeAmountInXD).
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Fee.sol
 **/
export class DynamicProtocolFeeArgs implements IArgsData {
  public static readonly CODER = new DynamicProtocolFeeArgsCoder()

  constructor(public readonly feeProvider: Address) {
    assert(!feeProvider.isZero(), 'Invalid feeProvider. Must be non zero address')
  }

  static decode(data: HexString): DynamicProtocolFeeArgs {
    return DynamicProtocolFeeArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      feeProvider: this.feeProvider.toString(),
    }
  }
}
