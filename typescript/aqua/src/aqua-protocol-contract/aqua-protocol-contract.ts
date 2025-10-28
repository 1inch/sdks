import {encodeFunctionData, keccak256} from 'viem'
import {CallInfo, Address, HexString} from '@1inch/sdk-shared'
import {ShipArgs, DockArgs, PullArgs, PushArgs} from './types'
import AQUA_PROTOCOL_ABI from '../abi/Aqua.abi.json' with {type: 'json'}

/**
 * Aqua Protocol Contract - Encoding/decoding for ship, dock, push, pull
 *
 * This class provides methods to encode and decode calldata for the Aqua Protocol
 * smart contract's core functions.
 */
export class AquaProtocolContract {
    /**
     * Encodes the calldata for the ship function
     * @param args - Ship arguments containing app address, strategy, tokens, and amounts
     * @returns Encoded calldata as HexString
     * @see https://github.com/1inch/aqua-protocol/blob/master/src/Aqua.sol#L34
     */
    static encodeShipCallData(args: ShipArgs): HexString {
        const {app, strategy, amountsAndTokens} = args

        const result = encodeFunctionData({
            abi: AQUA_PROTOCOL_ABI,
            functionName: 'ship',
            args: [
                app.toString(),
                strategy.toString(),
                amountsAndTokens.map(({token}) => token.toString()),
                amountsAndTokens.map(({amount}) => amount)
            ]
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
        const {app, strategyHash, tokens} = args

        const result = encodeFunctionData({
            abi: AQUA_PROTOCOL_ABI,
            functionName: 'dock',
            args: [
                app.toString(),
                strategyHash.toString(),
                tokens.map((t) => t.toString())
            ]
        })

        return new HexString(result)
    }

    /**
     * Encodes the calldata for the pull function
     * @param args - Pull arguments containing maker, strategy hash, token, amount, and recipient
     * @returns Encoded calldata as HexString
     * @see https://github.com/1inch/aqua-protocol/blob/master/src/Aqua.sol#L59
     */
    static encodePullCallData(args: PullArgs): HexString {
        const {maker, strategyHash, token, amount, to} = args

        const result = encodeFunctionData({
            abi: AQUA_PROTOCOL_ABI,
            functionName: 'pull',
            args: [
                maker.toString(),
                strategyHash.toString(),
                token.toString(),
                amount,
                to.toString()
            ]
        })

        return new HexString(result)
    }

    /**
     * Encodes the calldata for the push function
     * @param args - Push arguments containing maker, app, strategy hash, token, and amount
     * @returns Encoded calldata as HexString
     * @see https://github.com/1inch/aqua-protocol/blob/master/src/Aqua.sol#L69
     */
    static encodePushCallData(args: PushArgs): HexString {
        const {maker, app, strategyHash, token, amount} = args

        const result = encodeFunctionData({
            abi: AQUA_PROTOCOL_ABI,
            functionName: 'push',
            args: [
                maker.toString(),
                app.toString(),
                strategyHash.toString(),
                token.toString(),
                amount
            ]
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
            value: 0n
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
            value: 0n
        }
    }

    /**
     * Builds a complete transaction object for the pull function
     * @param contractAddress - The Aqua protocol contract address
     * @param params - Pull arguments
     * @returns Transaction call info with to, data, and value fields
     */
    static buildPullTx(contractAddress: Address, params: PullArgs): CallInfo {
        return {
            to: contractAddress.toString(),
            data: this.encodePullCallData(params).toString(),
            value: 0n
        }
    }

    /**
     * Builds a complete transaction object for the push function
     * @param contractAddress - The Aqua protocol contract address
     * @param params - Push arguments
     * @returns Transaction call info with to, data, and value fields
     */
    static buildPushTx(contractAddress: Address, params: PushArgs): CallInfo {
        return {
            to: contractAddress.toString(),
            data: this.encodePushCallData(params).toString(),
            value: 0n
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
}
