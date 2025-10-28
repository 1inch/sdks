import {describe, it, expect} from 'vitest'
import {Address, HexString} from '@1inch/sdk-shared'
import {DockArgs, PullArgs, PushArgs, ShipArgs} from './types'
import {AquaProtocolContract} from './aqua-protocol-contract'

describe('AquaProtocolContract', () => {
    const mockApp = Address.fromBigInt(1n)
    const mockMaker = Address.fromBigInt(2n)
    const mockToken = Address.fromBigInt(3n)
    const mockTo = Address.fromBigInt(4n)
    const mockContractAddress = Address.fromBigInt(5n)

    const mockStrategy = new HexString('0x01020304')
    const mockStrategyHash =
        AquaProtocolContract.calculateStrategyHash(mockStrategy)
    const mockAmount = BigInt(1000)
    const mockAmounts = [mockAmount, BigInt(2000)]
    const mockTokens = [mockToken, Address.fromBigInt(6n)]

    describe('encodeShipCallData', () => {
        it('should encode ship function call data correctly', () => {
            const args: ShipArgs = {
                app: mockApp,
                strategy: mockStrategy,
                amountsAndTokens: [
                    {token: mockTokens[0], amount: mockAmounts[0]},
                    {token: mockTokens[1], amount: mockAmounts[1]}
                ]
            }

            const result = AquaProtocolContract.encodeShipCallData(args)

            expect(result).toBeInstanceOf(HexString)
        })
    })

    describe('encodeDockCallData', () => {
        it('should encode dock function call data correctly', () => {
            const args: DockArgs = {
                app: mockApp,
                strategyHash: mockStrategyHash,
                tokens: mockTokens
            }

            const result = AquaProtocolContract.encodeDockCallData(args)

            expect(result).toBeInstanceOf(HexString)
            expect(result.toString().startsWith('0x')).toBe(true)
        })
    })

    describe('encodePullCallData', () => {
        it('should encode pull function call data correctly', () => {
            const args: PullArgs = {
                maker: mockMaker,
                strategyHash: mockStrategyHash,
                token: mockToken,
                amount: mockAmount,
                to: mockTo
            }

            const result = AquaProtocolContract.encodePullCallData(args)

            expect(result).toBeInstanceOf(HexString)
            expect(result.toString().startsWith('0x')).toBe(true)
        })
    })

    describe('encodePushCallData', () => {
        it('should encode push function call data correctly', () => {
            const args: PushArgs = {
                maker: mockMaker,
                app: mockApp,
                strategyHash: mockStrategyHash,
                token: mockToken,
                amount: mockAmount
            }

            const result = AquaProtocolContract.encodePushCallData(args)

            expect(result).toBeInstanceOf(HexString)
            expect(result.toString().startsWith('0x')).toBe(true)
        })
    })

    describe('buildShipTx', () => {
        it('should build ship transaction correctly', () => {
            const args: ShipArgs = {
                app: mockApp,
                strategy: mockStrategy,
                amountsAndTokens: [
                    {token: mockTokens[0], amount: mockAmounts[0]},
                    {token: mockTokens[1], amount: mockAmounts[1]}
                ]
            }

            const tx = AquaProtocolContract.buildShipTx(
                mockContractAddress,
                args
            )

            expect(tx).toBeDefined()
            expect(tx.to).toBe(mockContractAddress.toString())
            expect(tx.data.startsWith('0x')).toBe(true)
            expect(tx.value).toBe(0n)
        })
    })

    describe('buildDockTx', () => {
        it('should build dock transaction correctly', () => {
            const args: DockArgs = {
                app: mockApp,
                strategyHash: mockStrategyHash,
                tokens: mockTokens
            }

            const tx = AquaProtocolContract.buildDockTx(
                mockContractAddress,
                args
            )

            expect(tx).toBeDefined()
            expect(tx.to).toBe(mockContractAddress.toString())
            expect(tx.data.startsWith('0x')).toBe(true)
            expect(tx.value).toBe(0n)
        })
    })

    describe('buildPullTx', () => {
        it('should build pull transaction correctly', () => {
            const args: PullArgs = {
                maker: mockMaker,
                strategyHash: mockStrategyHash,
                token: mockToken,
                amount: mockAmount,
                to: mockTo
            }

            const tx = AquaProtocolContract.buildPullTx(
                mockContractAddress,
                args
            )

            expect(tx).toBeDefined()
            expect(tx.to).toBe(mockContractAddress.toString())
            expect(tx.data.startsWith('0x')).toBe(true)
            expect(tx.value).toBe(0n)
        })
    })

    describe('buildPushTx', () => {
        it('should build push transaction correctly', () => {
            const args: PushArgs = {
                maker: mockMaker,
                app: mockApp,
                strategyHash: mockStrategyHash,
                token: mockToken,
                amount: mockAmount
            }

            const tx = AquaProtocolContract.buildPushTx(
                mockContractAddress,
                args
            )

            expect(tx).toBeDefined()
            expect(tx.to).toBe(mockContractAddress.toString())
            expect(tx.data.startsWith('0x')).toBe(true)
            expect(tx.value).toBe(0n)
        })
    })

    describe('calculateStrategyHash', () => {
        it('should calculate strategy hash correctly', () => {
            const strategy = new HexString('0x01020304')

            const hash = AquaProtocolContract.calculateStrategyHash(strategy)

            expect(hash).toBeDefined()
            expect(hash).toBeInstanceOf(HexString)
            expect(hash.toString().length).toBe(66)
        })

        it('should produce consistent hashes for the same input', () => {
            const strategy = new HexString('0x01020304')

            const hash1 = AquaProtocolContract.calculateStrategyHash(strategy)
            const hash2 = AquaProtocolContract.calculateStrategyHash(strategy)

            expect(hash1.toString()).toBe(hash2.toString())
        })

        it('should produce different hashes for different inputs', () => {
            const strategy1 = new HexString('0x01020304')
            const strategy2 = new HexString('0x05060708')

            const hash1 = AquaProtocolContract.calculateStrategyHash(strategy1)
            const hash2 = AquaProtocolContract.calculateStrategyHash(strategy2)

            expect(hash1.toString()).not.toBe(hash2.toString())
        })
    })
})
