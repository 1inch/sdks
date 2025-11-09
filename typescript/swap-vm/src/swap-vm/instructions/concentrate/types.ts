import {AddressHalf} from '@1inch/sdk-shared'

export type TokenDelta = {
    readonly tokenHalf: AddressHalf
    readonly delta: bigint
}
