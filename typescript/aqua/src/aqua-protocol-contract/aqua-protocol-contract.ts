import { encodeFunctionData, keccak256 } from 'viem'
import type { CallInfo, Address } from '@1inch/sdk-core'
import { HexString } from '@1inch/sdk-core'
import type { ShipArgs, DockArgs } from './types'
import { AQUA_ABI } from '../abi/Aqua.abi'

/**
 * Aqua Protocol Contract - Encoding/decoding for ship, dock, push, pull
 *
 * This class provides methods to encode and decode calldata for the Aqua Protocol
 * smart contract's core functions.
 */
export class AquaProtocolContract {
  constructor(public readonly address: Address) {}

  /**
   * Encodes the calldata for the ship function
   * @param args - Ship arguments containing app address, strategy, tokens, and amounts
   * @returns Encoded calldata as HexString
   * @see https://github.com/1inch/aqua-protocol/blob/master/src/Aqua.sol#L34
   */
  static encodeShipCallData(args: ShipArgs): HexString {
    const { app, strategy, amountsAndTokens } = args

    const result = encodeFunctionData({
      abi: AQUA_ABI,
      functionName: 'ship',
      args: [
        app.toString(),
        strategy.toString(),
        amountsAndTokens.map(({ token }) => token.toString()),
        amountsAndTokens.map(({ amount }) => amount),
      ],
    })

    return new HexString(result)
  }

  /**
   * Encodes the calldata for the dock function
   * @param args - Dock arguments containing app address, strategy hash, and tokens
   * @returns Encoded calldata as HexString
   * @see https://github.com/1inch/aqua-protocol/blob/master/src/Aqua.sol#L49
   */
  static encodeDockCallData(args: DockArgs): HexString {
    const { app, strategyHash, tokens } = args

    const result = encodeFunctionData({
      abi: AQUA_ABI,
      functionName: 'dock',
      args: [app.toString(), strategyHash.toString(), tokens.map((t) => t.toString())],
    })

    return new HexString(result)
  }

  /**
   * Builds a complete transaction object for the ship function
   * @param contractAddress - The Aqua protocol contract address
   * @param params - Ship arguments
   * @returns Transaction call info with to, data, and value fields
   */
  static buildShipTx(contractAddress: Address, params: ShipArgs): CallInfo {
    return {
      to: contractAddress.toString(),
      data: this.encodeShipCallData(params).toString(),
      value: 0n,
    }
  }

  /**
   * Builds a complete transaction object for the dock function
   * @param contractAddress - The Aqua protocol contract address
   * @param params - Dock arguments
   * @returns Transaction call info with to, data, and value fields
   */
  static buildDockTx(contractAddress: Address, params: DockArgs): CallInfo {
    return {
      to: contractAddress.toString(),
      data: this.encodeDockCallData(params).toString(),
      value: 0n,
    }
  }

  /**
   * Calculate strategy hash from strategy bytes
   * @param strategy Strategy bytes
   * @returns Strategy hash
   */
  static calculateStrategyHash(strategy: HexString): HexString {
    return new HexString(keccak256(strategy.toString()))
  }

  public ship(params: ShipArgs): CallInfo {
    return AquaProtocolContract.buildShipTx(this.address, params)
  }

  public dock(params: DockArgs): CallInfo {
    return AquaProtocolContract.buildDockTx(this.address, params)
  }
}
