import {Address, HexString} from '@1inch/sdk-shared'

/**
 * Aqua Protocol types for the 4 core methods
 */

export type ShipArgs = {
    app: Address
    strategy: HexString
    amountsAndTokens: AmountsAndTokens[]
}

export type AmountsAndTokens = {
    amount: bigint
    token: Address
}

export type DockArgs = {
    app: Address
    /**
     *  should be as keccak256(strategy)
     */
    strategyHash: HexString
    tokens: Address[]
}

export type PullArgs = {
    maker: Address
    /**
     *  should be as keccak256(strategy)
     */
    strategyHash: HexString
    token: Address
    amount: bigint
    to: Address
}

export type PushArgs = {
    maker: Address
    app: Address
    /**
     *  should be as keccak256(strategy)
     */
    strategyHash: HexString
    token: Address
    amount: bigint
}

export type ShipDecodedResult = {
    functionName: string
    decodedArgs: ShipArgs
}

export enum EventAction {
    Pushed = 'pushed',
    Pulled = 'pulled',
    Shipped = 'shipped',
    Docked = 'docked'
}
