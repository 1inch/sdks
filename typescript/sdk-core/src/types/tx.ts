import type { Hex } from './bytes'

/**
 * Call info type for transaction data
 * Matching limit-order-sdk pattern
 */
export type CallInfo = {
  to: Hex
  data: Hex
  value: bigint
}
