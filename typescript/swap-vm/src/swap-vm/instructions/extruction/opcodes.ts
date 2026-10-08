// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { ExtructionArgs } from './extruction-args'
import { Opcode } from '../opcode'

/**
 * Calls external contract to perform custom logic, potentially modifying swap state
 *
 * The target is called with the current `nextPC`, the swap registers (balances and amounts) and
 * the remaining taker instruction args, and returns a new `nextPC`, new registers and how many
 * taker args bytes it consumed, so it can change control flow and swap amounts. `quote()` calls it
 * through the view-only `IStaticExtruction`, `swap()` through the state-changing `IExtruction`.
 *
 * WARNING:
 * - Both implementations must be deterministic and return the same results for the same inputs,
 *   otherwise quotes do not match swaps
 * - The target should be immutable (non-upgradeable), so its logic cannot change between quote
 *   and swap
 * - Takers/resolvers must validate strategies that use this instruction (target code,
 *   upgradeability, quote/swap consistency) before routing to them
 * - Makers must not use backward jumps to this instruction, it breaks quote/swap consistency
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/Extruction.sol#L33
 **/
export const extruction: Opcode<ExtructionArgs> = new Opcode(
  Symbol('Extruction.extruction'),
  ExtructionArgs.CODER,
)
