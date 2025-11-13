import type { AddressHalf } from '@1inch/sdk-core'

export type TokenBalance = {
  tokenHalf: AddressHalf
  value: bigint
}
