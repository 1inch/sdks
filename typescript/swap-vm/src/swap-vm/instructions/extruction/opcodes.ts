// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { ExtructionArgs } from './extruction-args'
import { Opcode } from '../opcode'

/**
 * Calls external contract to perform custom logic, potentially modifying swap state
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Extruction.sol#L33
 **/
export const extruction = new Opcode(Symbol('Extruction.extruction'), ExtructionArgs.CODER)
