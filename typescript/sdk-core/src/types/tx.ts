import type { Hex } from './bytes'

/**
 * Call info type for transaction data
 */
export type CallInfo = {
  to: Hex
  data: Hex
  value: bigint
}
