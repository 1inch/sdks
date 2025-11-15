/* eslint-disable max-lines-per-function */
import 'dotenv/config'
import { Address, HexString } from '@1inch/sdk-core'
import type { Hex } from 'viem'
import { encodeAbiParameters, encodeFunctionData, parseUnits } from 'viem'
import { ADDRESSES } from '@1inch/sdk-core/test-utils'
import type { ReadyEvmFork } from './setup-evm.js'
import { setupEvm } from './setup-evm.js'

import { AquaProtocolContract } from '../src/aqua-protocol-contract/aqua-protocol-contract.js'
import { AQUA_ABI } from '../src/abi/Aqua.abi.js'

describe('Aqua', () => {
  let forkNode: ReadyEvmFork
  let liqProviderAddress: Hex
  let swapperAddress: Hex

  const getAquaBalance = async (
    maker: Address | Hex,
    app: Address | Hex,
    strategyHash: Hex,
    token: Address | Hex,
  ): Promise<bigint> => {
    const [balance] = await forkNode.provider.readContract({
      address: forkNode.addresses.aqua,
      abi: AQUA_ABI,
      functionName: 'rawBalances',
      args: [maker.toString() as Hex, app.toString() as Hex, strategyHash, token.toString() as Hex],
    })

    return balance
  }

  beforeAll(async () => {
    forkNode = await setupEvm({ chainId: 1 })
    liqProviderAddress = await forkNode.liqProvider.getAddress()
    swapperAddress = await forkNode.swapper.getAddress()
  })

  test('should ship', async () => {
    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const strategyData = {
      maker: liqProviderAddress,
      token0: ADDRESSES.WETH,
      token1: ADDRESSES.USDC,
      feeBps: 0n,
      salt: '0x0000000000000000000000000000000000000000000000000000000000000001',
    } as const
    const strategy = encodeAbiParameters(
      [
        {
          name: 'strategy',
          type: 'tuple',
          components: [
            { name: 'maker', type: 'address' },
            { name: 'token0', type: 'address' },
            { name: 'token1', type: 'address' },
            { name: 'feeBps', type: 'uint256' },
            { name: 'salt', type: 'bytes32' },
          ],
        },
      ],
      [strategyData],
    )
    const strategyHash = AquaProtocolContract.calculateStrategyHash(
      new HexString(strategy),
    ).toString()

    const liquidityProvider = forkNode.liqProvider

    const wethBalanceBefore = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.xycSwap,
      strategyHash,
      ADDRESSES.WETH,
    )
    const usdcBalanceBefore = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.xycSwap,
      strategyHash,
      ADDRESSES.USDC,
    )

    const usdcAmount = parseUnits('1000', 6)
    const wethAmount = parseUnits('1', 18)

    const tx = aqua.ship({
      app: new Address(forkNode.addresses.xycSwap),
      strategy: new HexString(strategy),
      amountsAndTokens: [
        {
          amount: usdcAmount,
          token: new Address(ADDRESSES.USDC),
        },
        {
          amount: wethAmount,
          token: new Address(ADDRESSES.WETH),
        },
      ],
    })

    await liquidityProvider.send(tx)

    const wethBalanceAfter = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.xycSwap,
      strategyHash,
      ADDRESSES.WETH,
    )
    const usdcBalanceAfter = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.xycSwap,
      strategyHash,
      ADDRESSES.USDC,
    )

    expect(wethBalanceAfter).to.equal(wethBalanceBefore + wethAmount)
    expect(usdcBalanceAfter).to.equal(usdcBalanceBefore + usdcAmount)
  })

  test('should swap', async () => {
    const strategyData = {
      maker: liqProviderAddress,
      token0: ADDRESSES.WETH,
      token1: ADDRESSES.USDC,
      feeBps: 0n,
      salt: '0x0000000000000000000000000000000000000000000000000000000000000001',
    } as const
    const strategy = encodeAbiParameters(
      [
        {
          name: 'strategy',
          type: 'tuple',
          components: [
            { name: 'maker', type: 'address' },
            { name: 'token0', type: 'address' },
            { name: 'token1', type: 'address' },
            { name: 'feeBps', type: 'uint256' },
            { name: 'salt', type: 'bytes32' },
          ],
        },
      ],
      [strategyData],
    )
    const strategyHash = AquaProtocolContract.calculateStrategyHash(
      new HexString(strategy),
    ).toString()

    const swapper = forkNode.swapper
    const providerWethBalanceBefore = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.xycSwap,
      strategyHash,
      ADDRESSES.WETH,
    )
    const providerUsdcBalanceBefore = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.xycSwap,
      strategyHash,
      ADDRESSES.USDC,
    )
    const swapperWethBalanceBefore = await swapper.tokenBalance(ADDRESSES.WETH)
    const swapperUsdcBalanceBefore = await swapper.tokenBalance(ADDRESSES.USDC)

    const srcAmount = parseUnits('10', 6)
    const srcToken = ADDRESSES.USDC
    const isZeroForOne = (srcToken as string) == strategyData.token0

    const encodedData = encodeFunctionData({
      abi: [
        {
          type: 'function',
          name: 'swap',
          inputs: [
            { name: 'app', type: 'address', internalType: 'contract XYCSwap' },
            {
              name: 'strategy',
              type: 'tuple',
              internalType: 'struct XYCSwap.Strategy',
              components: [
                { name: 'maker', type: 'address', internalType: 'address' },
                { name: 'token0', type: 'address', internalType: 'address' },
                { name: 'token1', type: 'address', internalType: 'address' },
                { name: 'feeBps', type: 'uint256', internalType: 'uint256' },
                { name: 'salt', type: 'bytes32', internalType: 'bytes32' },
              ],
            },
            { name: 'zeroForOne', type: 'bool', internalType: 'bool' },
            { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
          ],
          outputs: [{ name: 'amountOut', type: 'uint256', internalType: 'uint256' }],
          stateMutability: 'nonpayable',
        },
      ],
      functionName: 'swap',
      args: [forkNode.addresses.xycSwap, strategyData, isZeroForOne, srcAmount],
    })

    // Simulate the call to get the dstAmount
    const simulateResult = await forkNode.provider.call({
      account: swapperAddress,
      to: forkNode.addresses.testTrader,
      value: 0n,
      data: encodedData,
    })

    const dstAmount = BigInt(simulateResult.data || '0x0')

    const swapTx = await swapper.send({
      to: forkNode.addresses.testTrader,
      value: 0n,
      data: encodedData,
    })

    await forkNode.provider.waitForTransactionReceipt({ hash: swapTx.txHash })

    const providerWethBalanceAfter = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.xycSwap,
      strategyHash,
      ADDRESSES.WETH,
    )
    const providerUsdcBalanceAfter = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.xycSwap,
      strategyHash,
      ADDRESSES.USDC,
    )
    expect(providerWethBalanceAfter).to.equal(providerWethBalanceBefore - dstAmount)
    expect(providerUsdcBalanceAfter).to.equal(providerUsdcBalanceBefore + srcAmount)

    const swapperWethBalanceAfter = await swapper.tokenBalance(ADDRESSES.WETH)
    const swapperUsdcBalanceAfter = await swapper.tokenBalance(ADDRESSES.USDC)
    expect(swapperWethBalanceAfter).to.equal(swapperWethBalanceBefore + dstAmount)
    expect(swapperUsdcBalanceAfter).to.equal(swapperUsdcBalanceBefore - srcAmount)
  })

  test('should dock', async () => {
    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const strategyData = {
      maker: liqProviderAddress,
      token0: ADDRESSES.WETH,
      token1: ADDRESSES.USDC,
      feeBps: 0n,
      salt: '0x0000000000000000000000000000000000000000000000000000000000000001',
    } as const
    const strategy = encodeAbiParameters(
      [
        {
          name: 'strategy',
          type: 'tuple',
          components: [
            { name: 'maker', type: 'address' },
            { name: 'token0', type: 'address' },
            { name: 'token1', type: 'address' },
            { name: 'feeBps', type: 'uint256' },
            { name: 'salt', type: 'bytes32' },
          ],
        },
      ],
      [strategyData],
    )
    const strategyHash = AquaProtocolContract.calculateStrategyHash(
      new HexString(strategy),
    ).toString()

    const liquidityProvider = forkNode.liqProvider

    const wethBalanceBefore = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.xycSwap,
      strategyHash,
      ADDRESSES.WETH,
    )
    const usdcBalanceBefore = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.xycSwap,
      strategyHash,
      ADDRESSES.USDC,
    )

    expect(wethBalanceBefore).to.greaterThan(0)
    expect(usdcBalanceBefore).to.greaterThan(0)

    const tx = aqua.dock({
      app: new Address(forkNode.addresses.xycSwap),
      strategyHash: new HexString(strategyHash),
      tokens: [ADDRESSES.USDC, ADDRESSES.WETH].map((a) => new Address(a)),
    })

    await liquidityProvider.send(tx)

    const wethBalanceAfter = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.xycSwap,
      strategyHash,
      ADDRESSES.WETH,
    )
    const usdcBalanceAfter = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.xycSwap,
      strategyHash,
      ADDRESSES.USDC,
    )

    expect(wethBalanceAfter).to.eq(0n)
    expect(usdcBalanceAfter).to.eq(0n)
  })
})
