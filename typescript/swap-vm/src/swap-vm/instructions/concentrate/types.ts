import type { AddressHalf } from '@1inch/sdk-core'

export type TokenDelta = {
  readonly tokenHalf: AddressHalf
  readonly delta: bigint
}
