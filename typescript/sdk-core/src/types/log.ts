import type { Hex } from './bytes'

/**
 * Raw log event with data and topics
 */
export type LogLike = {
  data: Hex
  topics: [signature: Hex, ...Hex[]] | []
}
