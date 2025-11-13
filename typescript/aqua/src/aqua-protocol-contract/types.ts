import type { Address, HexString } from '@1inch/sdk-core'

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

export type ShipDecodedResult = {
  functionName: string
  decodedArgs: ShipArgs
}
