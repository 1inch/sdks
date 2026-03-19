/* eslint-disable max-lines-per-function */
import 'dotenv/config'
import type { NetworkEnum } from '@1inch/sdk-core'
import { Address, HexString, Interaction } from '@1inch/sdk-core'
import type { Hex } from 'viem'
import { formatUnits, decodeEventLog, decodeFunctionResult, parseUnits, toHex } from 'viem'
import { AquaProtocolContract, ABI } from '@1inch/aqua-sdk'
import { expect } from 'vitest'
import type { TestWallet } from '@1inch/sdk-core/test-utils'
import { ADDRESSES } from '@1inch/sdk-core/test-utils'
import { ReadyEvmFork } from './setup-evm.js'
import { Order } from '../src/swap-vm/order.js'
import { MakerTraits } from '../src/swap-vm/maker-traits.js'
import {
  AquaXYCAmmStrategy,
  AquaProgramBuilder,
  ProgramBuilder,
  SwapVMContract,
  TakerTraits,
  instructions,
  AquaPeggedAmmStrategy,
} from '../src'
import { SWAP_VM_ABI } from '../src/abi/SwapVM.abi.js'
import { Opcode } from '../src/swap-vm/instructions/opcode.js'

import { ConcentrateLiquidityCalculator } from '../src/swap-vm/instructions/concentrate/concentrate-liquidity-calculator/concentrate-liquidity-calculator'

describe('SwapVM', () => {
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
      abi: ABI.AQUA_ABI,
      functionName: 'rawBalances',
      args: [maker.toString() as Hex, app.toString() as Hex, strategyHash, token.toString() as Hex],
    })

    return balance
  }

  const trackBalances = async (
    swapper: TestWallet,
    strategyHash: Hex,
    srcToken: Address | Hex,
    dstToken: Address | Hex,
    expectedSrcAmount: bigint,
    expectedDstAmount: bigint,
    swap: () => Promise<Hex>,
  ): Promise<Hex> => {
    const lpSrcBalanceBefore = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.swapVMAquaRouter,
      strategyHash,
      srcToken,
    )
    const lpDstBalanceBefore = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.swapVMAquaRouter,
      strategyHash,
      dstToken,
    )

    const swapperSrcBalanceBefore = await swapper.tokenBalance(srcToken.toString())
    const swapperDstBalanceBefore = await swapper.tokenBalance(dstToken.toString())

    const txHash = await swap()

    const lpSrcBalanceAfter = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.swapVMAquaRouter,
      strategyHash,
      srcToken,
    )
    const lpDstBalanceAfter = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.swapVMAquaRouter,
      strategyHash,
      dstToken,
    )

    expect(lpSrcBalanceAfter).to.equal(lpSrcBalanceBefore + expectedSrcAmount)
    expect(lpDstBalanceAfter).to.equal(lpDstBalanceBefore - expectedDstAmount)

    const swapperSrcBalanceAfter = await swapper.tokenBalance(srcToken.toString())
    const swapperDstBalanceAfter = await swapper.tokenBalance(dstToken.toString())
    expect(swapperSrcBalanceAfter).to.equal(swapperSrcBalanceBefore - expectedSrcAmount)
    expect(swapperDstBalanceAfter).to.equal(swapperDstBalanceBefore + expectedDstAmount)

    return txHash
  }

  beforeAll(async () => {
    forkNode = await ReadyEvmFork.setup({ chainId: 1 })
    liqProviderAddress = await forkNode.liqProvider.getAddress()
    swapperAddress = await forkNode.swapper.getAddress()
  })

  test('should correct calculate order hash', async () => {
    const program = new AquaProgramBuilder()
      .concentrateGrowLiquidity2D({ sqrtPriceMin: 1000n, sqrtPriceMax: 2000n })
      .build()
    const order = Order.new({
      maker: new Address(swapperAddress),
      traits: MakerTraits.default(),
      program,
    })

    const calculatedHash = order.hash({
      chainId: forkNode.chainId as NetworkEnum,
      name: 'TestAquaSwapVMRouter',
      version: '1.0',
      verifyingContract: new Address(forkNode.addresses.swapVMAquaRouter),
    })

    const hashFromContract = await forkNode.provider.readContract({
      address: forkNode.addresses.swapVMAquaRouter,
      abi: SWAP_VM_ABI,
      functionName: 'hash',
      args: [order.build()],
    })

    expect(calculatedHash.toString()).toEqual(hashFromContract)
  })

  test('should swap by AquaXYCAmmStrategy', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.swapVMAquaRouter))

    const USDC = new Address(ADDRESSES.USDC)
    const WETH = new Address(ADDRESSES.WETH)

    const program = AquaXYCAmmStrategy.new().build()

    const order = Order.new({
      maker: new Address(liqProviderAddress),
      program,
      traits: MakerTraits.default(),
    })

    const strategyHash = order
      .hash({
        chainId: forkNode.chainId as NetworkEnum,
        name: 'TestAquaSwapVMRouter',
        version: '1.0',
        verifyingContract: new Address(forkNode.addresses.swapVMAquaRouter),
      })
      .toString()

    const tx = aqua.ship({
      app: new Address(forkNode.addresses.swapVMAquaRouter),
      strategy: order.encode(),
      amountsAndTokens: [
        {
          amount: parseUnits('10000', 6),
          token: USDC,
        },
        {
          amount: parseUnits('5', 18),
          token: WETH,
        },
      ],
    })

    await liquidityProvider.send(tx)

    const srcAmount = parseUnits('100', 6)

    const swapParams = {
      order,
      amount: srcAmount,
      takerTraits: TakerTraits.default(),
      tokenIn: USDC,
      tokenOut: WETH,
    }

    // Simulate the call to get the dstAmount
    const simulateResult = await forkNode.provider.call({
      account: swapperAddress,
      ...swapVM.quote(swapParams),
    })

    const [_, dstAmount] = decodeFunctionResult({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      data: simulateResult.data!,
    })

    const swap = swapVM.swap(swapParams)

    await trackBalances(
      swapper,
      strategyHash,
      swapParams.tokenIn,
      swapParams.tokenOut,
      swapParams.amount,
      dstAmount,
      async () => {
        const { txHash } = await swapper.send({ ...swap, allowFail: false })

        // await forkNode.printTrace(txHash)
        return txHash
      },
    )
  })

  test('should swap by AquaXYCAmmStrategy Concentrated (2000 - 3000 range) with 2500 spot price (USDC -> WETH)', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.swapVMAquaRouter))

    const USDC = new Address(ADDRESSES.USDC)
    const WETH = new Address(ADDRESSES.WETH)
    const USDC_DECIMALS = 6n
    const WETH_DECIMALS = 18n

    const calculator = ConcentrateLiquidityCalculator.new({
      tokenA: {
        address: WETH,
        decimals: WETH_DECIMALS,
        maxAvailableLiquidity: 400n * 10n ** WETH_DECIMALS,
      },
      tokenB: {
        address: USDC,
        decimals: USDC_DECIMALS,
        maxAvailableLiquidity: 1_000_000n * 10n ** USDC_DECIMALS,
      },
    })

    const info = calculator.computeMaxAllocation({
      quoteToken: USDC,
      minPriceRaw: 2000n * 10n ** (USDC_DECIMALS + WETH_DECIMALS),
      spotPriceRaw: 2500n * 10n ** (USDC_DECIMALS + WETH_DECIMALS),
      maxPriceRaw: 3000n * 10n ** (USDC_DECIMALS + WETH_DECIMALS),
    })

    const program = AquaXYCAmmStrategy.newConcentrate({
      sqrtPriceMin: info.sqrtPriceMin,
      sqrtPriceMax: info.sqrtPriceMax,
    }).build()

    const order = Order.new({
      maker: new Address(liqProviderAddress),
      program,
      traits: MakerTraits.default(),
    })

    const strategyHash = order
      .hash({
        chainId: forkNode.chainId as NetworkEnum,
        name: 'TestAquaSwapVMRouter',
        version: '1.0',
        verifyingContract: new Address(forkNode.addresses.swapVMAquaRouter),
      })
      .toString()

    const tx = aqua.ship({
      app: new Address(forkNode.addresses.swapVMAquaRouter),
      strategy: order.encode(),
      amountsAndTokens: [
        {
          token: calculator.token0.address,
          amount: info.token0Reserve,
        },
        {
          token: calculator.token1.address,
          amount: info.token1Reserve,
        },
      ],
    })

    await liquidityProvider.send(tx)

    const srcAmount = parseUnits('1', 6)

    const swapParams = {
      order,
      amount: srcAmount,
      takerTraits: TakerTraits.default(),
      tokenIn: USDC,
      tokenOut: WETH,
    }

    // Simulate the call to get the dstAmount
    const simulateResult = await forkNode.provider.call({
      account: swapperAddress,
      ...swapVM.quote(swapParams),
    })

    const [_, dstAmount] = decodeFunctionResult({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      data: simulateResult.data!,
    })

    const swap = swapVM.swap(swapParams)

    await trackBalances(
      swapper,
      strategyHash,
      swapParams.tokenIn,
      swapParams.tokenOut,
      swapParams.amount,
      dstAmount,
      async () => {
        const { txHash } = await swapper.send({ ...swap, allowFail: false })

        // await forkNode.printTrace(txHash)
        return txHash
      },
    )

    const price = +formatUnits(srcAmount, 6) / +formatUnits(dstAmount, 18)

    expect(price).to.equal(2500.0002639315903)
  })

  test('should swap by AquaXYCAmmStrategy Concentrated (2000 - 3000 range) with 2500 spot price (WETH -> USDC)', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.swapVMAquaRouter))

    const USDC = new Address(ADDRESSES.USDC)
    const WETH = new Address(ADDRESSES.WETH)
    const USDC_DECIMALS = 6n
    const WETH_DECIMALS = 18n

    const calculator = ConcentrateLiquidityCalculator.new({
      tokenA: {
        address: WETH,
        decimals: WETH_DECIMALS,
        maxAvailableLiquidity: 400n * 10n ** WETH_DECIMALS,
      },
      tokenB: {
        address: USDC,
        decimals: USDC_DECIMALS,
        maxAvailableLiquidity: 1_000_000n * 10n ** USDC_DECIMALS,
      },
    })

    const info = calculator.computeMaxAllocation({
      quoteToken: WETH,
      minPriceRaw: parseUnits('0.0003333333333', Number(USDC_DECIMALS + WETH_DECIMALS)),
      spotPriceRaw: parseUnits('0.0004', Number(USDC_DECIMALS + WETH_DECIMALS)),
      maxPriceRaw: parseUnits('0.0005', Number(USDC_DECIMALS + WETH_DECIMALS)),
    })

    const program = AquaXYCAmmStrategy.newConcentrate({
      sqrtPriceMin: info.sqrtPriceMin,
      sqrtPriceMax: info.sqrtPriceMax,
    })
      .withSalt(1234n)
      .build()

    const order = Order.new({
      maker: new Address(liqProviderAddress),
      program,
      traits: MakerTraits.default(),
    })

    const strategyHash = order
      .hash({
        chainId: forkNode.chainId as NetworkEnum,
        name: 'TestAquaSwapVMRouter',
        version: '1.0',
        verifyingContract: new Address(forkNode.addresses.swapVMAquaRouter),
      })
      .toString()

    const tx = aqua.ship({
      app: new Address(forkNode.addresses.swapVMAquaRouter),
      strategy: order.encode(),
      amountsAndTokens: [
        {
          token: calculator.token0.address,
          amount: info.token0Reserve,
        },
        {
          token: calculator.token1.address,
          amount: info.token1Reserve,
        },
      ],
    })

    await liquidityProvider.send(tx)

    const srcAmount = parseUnits('0.0004', 18)

    const swapParams = {
      order,
      amount: srcAmount,
      takerTraits: TakerTraits.default(),
      tokenIn: WETH,
      tokenOut: USDC,
    }

    // Simulate the call to get the dstAmount
    const simulateResult = await forkNode.provider.call({
      account: swapperAddress,
      ...swapVM.quote(swapParams),
    })

    const [_, dstAmount] = decodeFunctionResult({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      data: simulateResult.data!,
    })

    const swap = swapVM.swap(swapParams)

    await trackBalances(
      swapper,
      strategyHash,
      swapParams.tokenIn,
      swapParams.tokenOut,
      swapParams.amount,
      dstAmount,
      async () => {
        const { txHash } = await swapper.send({ ...swap, allowFail: false })

        // await forkNode.printTrace(txHash)
        return txHash
      },
    )

    const price = +formatUnits(dstAmount, 6) / +formatUnits(srcAmount, 18)

    expect(price).to.equal(2499.9975)
  })

  test('should swap by AquaXYCAmmStrategy Concentrated (2000 - 3000 range) with 2500 spot price (WETH -> USDT)', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.swapVMAquaRouter))

    const USDT = new Address(ADDRESSES.USDT)
    const WETH = new Address(ADDRESSES.WETH)
    const USDT_DECIMALS = 6n
    const WETH_DECIMALS = 18n

    const calculator = ConcentrateLiquidityCalculator.new({
      tokenA: {
        address: WETH,
        decimals: WETH_DECIMALS,
        maxAvailableLiquidity: 400n * 10n ** WETH_DECIMALS,
      },
      tokenB: {
        address: USDT,
        decimals: USDT_DECIMALS,
        maxAvailableLiquidity: 1_000_000n * 10n ** USDT_DECIMALS,
      },
    })

    const info = calculator.computeMaxAllocation({
      quoteToken: WETH,
      minPriceRaw: parseUnits('0.0003333333333', Number(USDT_DECIMALS + WETH_DECIMALS)),
      spotPriceRaw: parseUnits('0.0004', Number(USDT_DECIMALS + WETH_DECIMALS)),
      maxPriceRaw: parseUnits('0.0005', Number(USDT_DECIMALS + WETH_DECIMALS)),
    })

    const program = AquaXYCAmmStrategy.newConcentrate({
      sqrtPriceMin: info.sqrtPriceMin,
      sqrtPriceMax: info.sqrtPriceMax,
    })
      .withSalt(12345n)
      .build()

    const order = Order.new({
      maker: new Address(liqProviderAddress),
      program,
      traits: MakerTraits.default(),
    })

    const strategyHash = order
      .hash({
        chainId: forkNode.chainId as NetworkEnum,
        name: 'TestAquaSwapVMRouter',
        version: '1.0',
        verifyingContract: new Address(forkNode.addresses.swapVMAquaRouter),
      })
      .toString()

    const tx = aqua.ship({
      app: new Address(forkNode.addresses.swapVMAquaRouter),
      strategy: order.encode(),
      amountsAndTokens: [
        {
          token: calculator.token0.address,
          amount: info.token0Reserve,
        },
        {
          token: calculator.token1.address,
          amount: info.token1Reserve,
        },
      ],
    })

    await liquidityProvider.send(tx)

    const srcAmount = parseUnits('0.0004', 18)

    const swapParams = {
      order,
      amount: srcAmount,
      takerTraits: TakerTraits.default(),
      tokenIn: WETH,
      tokenOut: USDT,
    }

    // Simulate the call to get the dstAmount
    const simulateResult = await forkNode.provider.call({
      account: swapperAddress,
      ...swapVM.quote(swapParams),
    })

    const [_, dstAmount] = decodeFunctionResult({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      data: simulateResult.data!,
    })

    const swap = swapVM.swap(swapParams)

    await trackBalances(
      swapper,
      strategyHash,
      swapParams.tokenIn,
      swapParams.tokenOut,
      swapParams.amount,
      dstAmount,
      async () => {
        const { txHash } = await swapper.send({ ...swap, allowFail: false })

        // await forkNode.printTrace(txHash)
        return txHash
      },
    )

    const price = +formatUnits(dstAmount, 6) / +formatUnits(srcAmount, 18)

    expect(price).to.equal(2499.9975)
  })

  test('should swap by AquaXYCAmmStrategy Concentrated (2000 - 3000 range) with 2500 spot price (USDT -> WETH)', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.swapVMAquaRouter))

    const USDT = new Address(ADDRESSES.USDT)
    const WETH = new Address(ADDRESSES.WETH)
    const USDT_DECIMALS = 6n
    const WETH_DECIMALS = 18n

    const calculator = ConcentrateLiquidityCalculator.new({
      tokenA: {
        address: WETH,
        decimals: WETH_DECIMALS,
        maxAvailableLiquidity: 400n * 10n ** WETH_DECIMALS,
      },
      tokenB: {
        address: USDT,
        decimals: USDT_DECIMALS,
        maxAvailableLiquidity: 1_000_000n * 10n ** USDT_DECIMALS,
      },
    })

    const info = calculator.computeMaxAllocation({
      quoteToken: USDT,
      minPriceRaw: 2000n * 10n ** (USDT_DECIMALS + WETH_DECIMALS),
      spotPriceRaw: 2500n * 10n ** (USDT_DECIMALS + WETH_DECIMALS),
      maxPriceRaw: 3000n * 10n ** (USDT_DECIMALS + WETH_DECIMALS),
    })

    const program = AquaXYCAmmStrategy.newConcentrate({
      sqrtPriceMin: info.sqrtPriceMin,
      sqrtPriceMax: info.sqrtPriceMax,
    }).build()

    const order = Order.new({
      maker: new Address(liqProviderAddress),
      program,
      traits: MakerTraits.default(),
    })

    const strategyHash = order
      .hash({
        chainId: forkNode.chainId as NetworkEnum,
        name: 'TestAquaSwapVMRouter',
        version: '1.0',
        verifyingContract: new Address(forkNode.addresses.swapVMAquaRouter),
      })
      .toString()

    const tx = aqua.ship({
      app: new Address(forkNode.addresses.swapVMAquaRouter),
      strategy: order.encode(),
      amountsAndTokens: [
        {
          token: calculator.token0.address,
          amount: info.token0Reserve,
        },
        {
          token: calculator.token1.address,
          amount: info.token1Reserve,
        },
      ],
    })

    await liquidityProvider.send(tx)

    const srcAmount = parseUnits('1', 6)

    const swapParams = {
      order,
      amount: srcAmount,
      takerTraits: TakerTraits.default(),
      tokenIn: USDT,
      tokenOut: WETH,
    }

    // Simulate the call to get the dstAmount
    const simulateResult = await forkNode.provider.call({
      account: swapperAddress,
      ...swapVM.quote(swapParams),
    })

    const [_, dstAmount] = decodeFunctionResult({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      data: simulateResult.data!,
    })

    const swap = swapVM.swap(swapParams)

    await trackBalances(
      swapper,
      strategyHash,
      swapParams.tokenIn,
      swapParams.tokenOut,
      swapParams.amount,
      dstAmount,
      async () => {
        const { txHash } = await swapper.send({ ...swap, allowFail: false })

        // await forkNode.printTrace(txHash)
        return txHash
      },
    )

    const price = +formatUnits(srcAmount, 6) / +formatUnits(dstAmount, 18)

    expect(price).to.equal(2500.000263885709)
  })

  test('should swap by AquaXYCAmmStrategy Concentrated (2000 - 3000 range) with 2500 spot price (USDT -> WBTC)', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.swapVMAquaRouter))

    const USDT = new Address(ADDRESSES.USDT)
    const WBTC = new Address(ADDRESSES.WBTC)
    const USDT_DECIMALS = 6n
    const WBTC_DECIMALS = 8n

    const calculator = ConcentrateLiquidityCalculator.new({
      tokenA: {
        address: WBTC,
        decimals: WBTC_DECIMALS,
        maxAvailableLiquidity: 50n * 10n ** WBTC_DECIMALS,
      },
      tokenB: {
        address: USDT,
        decimals: USDT_DECIMALS,
        maxAvailableLiquidity: 1_000_000n * 10n ** USDT_DECIMALS,
      },
    })

    const info = calculator.computeMaxAllocation({
      quoteToken: USDT,
      minPriceRaw: 55_000n * 10n ** (USDT_DECIMALS + WBTC_DECIMALS),
      spotPriceRaw: 60_000n * 10n ** (USDT_DECIMALS + WBTC_DECIMALS),
      maxPriceRaw: 65_000n * 10n ** (USDT_DECIMALS + WBTC_DECIMALS),
    })

    const program = AquaXYCAmmStrategy.newConcentrate({
      sqrtPriceMin: info.sqrtPriceMin,
      sqrtPriceMax: info.sqrtPriceMax,
    }).build()

    const order = Order.new({
      maker: new Address(liqProviderAddress),
      program,
      traits: MakerTraits.default(),
    })

    const strategyHash = order
      .hash({
        chainId: forkNode.chainId as NetworkEnum,
        name: 'TestAquaSwapVMRouter',
        version: '1.0',
        verifyingContract: new Address(forkNode.addresses.swapVMAquaRouter),
      })
      .toString()

    const tx = aqua.ship({
      app: new Address(forkNode.addresses.swapVMAquaRouter),
      strategy: order.encode(),
      amountsAndTokens: [
        {
          token: calculator.token0.address,
          amount: info.token0Reserve,
        },
        {
          token: calculator.token1.address,
          amount: info.token1Reserve,
        },
      ],
    })

    await liquidityProvider.send(tx)

    const srcAmount = parseUnits('100', 6)

    const swapParams = {
      order,
      amount: srcAmount,
      takerTraits: TakerTraits.default(),
      tokenIn: USDT,
      tokenOut: WBTC,
    }

    // Simulate the call to get the dstAmount
    const simulateResult = await forkNode.provider.call({
      account: swapperAddress,
      ...swapVM.quote(swapParams),
    })

    const [_, dstAmount] = decodeFunctionResult({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      data: simulateResult.data!,
    })

    const swap = swapVM.swap(swapParams)

    await trackBalances(
      swapper,
      strategyHash,
      swapParams.tokenIn,
      swapParams.tokenOut,
      swapParams.amount,
      dstAmount,
      async () => {
        const { txHash } = await swapper.send({ ...swap, allowFail: false })

        // await forkNode.printTrace(txHash)

        return txHash
      },
    )

    const price = +formatUnits(srcAmount, 6) / +formatUnits(dstAmount, 8)

    expect(price).to.equal(60000.60000600006)
  })

  test('should swap by AquaXYCAmmStrategy Concentrated (2000 - 3000 range) with 2500 spot price (WBTC -> USDT)', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.swapVMAquaRouter))

    const USDT = new Address(ADDRESSES.USDT)
    const WBTC = new Address(ADDRESSES.WBTC)
    const USDT_DECIMALS = 6n
    const WBTC_DECIMALS = 8n

    const calculator = ConcentrateLiquidityCalculator.new({
      tokenA: {
        address: WBTC,
        decimals: WBTC_DECIMALS,
        maxAvailableLiquidity: 50n * 10n ** WBTC_DECIMALS,
      },
      tokenB: {
        address: USDT,
        decimals: USDT_DECIMALS,
        maxAvailableLiquidity: 1_000_000n * 10n ** USDT_DECIMALS,
      },
    })

    const info = calculator.computeMaxAllocation({
      quoteToken: WBTC,
      minPriceRaw: parseUnits('0.00001538461538', Number(USDT_DECIMALS + WBTC_DECIMALS)),
      spotPriceRaw: parseUnits('0.00001666666667', Number(USDT_DECIMALS + WBTC_DECIMALS)),
      maxPriceRaw: parseUnits('0.00001818181818', Number(USDT_DECIMALS + WBTC_DECIMALS)),
    })

    const program = AquaXYCAmmStrategy.newConcentrate({
      sqrtPriceMin: info.sqrtPriceMin,
      sqrtPriceMax: info.sqrtPriceMax,
    })
      .withSalt(123456n)
      .build()

    const order = Order.new({
      maker: new Address(liqProviderAddress),
      program,
      traits: MakerTraits.default(),
    })

    const strategyHash = order
      .hash({
        chainId: forkNode.chainId as NetworkEnum,
        name: 'TestAquaSwapVMRouter',
        version: '1.0',
        verifyingContract: new Address(forkNode.addresses.swapVMAquaRouter),
      })
      .toString()

    const tx = aqua.ship({
      app: new Address(forkNode.addresses.swapVMAquaRouter),
      strategy: order.encode(),
      amountsAndTokens: [
        {
          token: calculator.token0.address,
          amount: info.token0Reserve,
        },
        {
          token: calculator.token1.address,
          amount: info.token1Reserve,
        },
      ],
    })

    await liquidityProvider.send(tx)

    const srcAmount = parseUnits('0.0017', 8)

    const swapParams = {
      order,
      amount: srcAmount,
      takerTraits: TakerTraits.default(),
      tokenIn: WBTC,
      tokenOut: USDT,
    }

    // Simulate the call to get the dstAmount
    const simulateResult = await forkNode.provider.call({
      account: swapperAddress,
      ...swapVM.quote(swapParams),
    })

    const [_, dstAmount] = decodeFunctionResult({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      data: simulateResult.data!,
    })

    const swap = swapVM.swap(swapParams)

    await trackBalances(
      swapper,
      strategyHash,
      swapParams.tokenIn,
      swapParams.tokenOut,
      swapParams.amount,
      dstAmount,
      async () => {
        const { txHash } = await swapper.send({ ...swap, allowFail: false })

        // await forkNode.printTrace(txHash)
        return txHash
      },
    )

    const price = +formatUnits(dstAmount, 6) / +formatUnits(srcAmount, 8)

    expect(price).to.equal(59999.739411764705)
  })

  test('should swap by AquaXYCAmmStrategy Concentrated (2000 - 3000 range) and 30bps flat fees', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.swapVMAquaRouter))

    const USDC = new Address(ADDRESSES.USDC)
    const WETH = new Address(ADDRESSES.WETH)

    const program = AquaXYCAmmStrategy.newConcentrate({
      rawPriceMin: (10n ** 18n * 10n ** 18n) / (3000n * 10n ** 6n),
      rawPriceMax: (10n ** 18n * 10n ** 18n) / (2000n * 10n ** 6n),
    })
      .withFeeTokenIn(30)
      .build()

    const order = Order.new({
      maker: new Address(liqProviderAddress),
      program,
      traits: MakerTraits.default(),
    })

    const strategyHash = order
      .hash({
        chainId: forkNode.chainId as NetworkEnum,
        name: 'TestAquaSwapVMRouter',
        version: '1.0',
        verifyingContract: new Address(forkNode.addresses.swapVMAquaRouter),
      })
      .toString()

    const tx = aqua.ship({
      app: new Address(forkNode.addresses.swapVMAquaRouter),
      strategy: order.encode(),
      amountsAndTokens: [
        {
          amount: parseUnits('1000000', 6),
          token: USDC,
        },
        {
          amount: parseUnits('400', 18),
          token: WETH,
        },
      ],
    })

    await liquidityProvider.send(tx)

    const srcAmount = parseUnits('2500', 6)

    const swapParams = {
      order,
      amount: srcAmount,
      takerTraits: TakerTraits.default(),
      tokenIn: USDC,
      tokenOut: WETH,
    }

    // Simulate the call to get the dstAmount
    const simulateResult = await forkNode.provider.call({
      account: swapperAddress,
      ...swapVM.quote(swapParams),
    })

    const [_, dstAmount] = decodeFunctionResult({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      data: simulateResult.data!,
    })

    const swap = swapVM.swap(swapParams)

    await trackBalances(
      swapper,
      strategyHash,
      swapParams.tokenIn,
      swapParams.tokenOut,
      swapParams.amount,
      dstAmount,
      async () => {
        const { txHash } = await swapper.send({ ...swap, allowFail: false })

        // await forkNode.printTrace(txHash)
        return txHash
      },
    )

    const price = +formatUnits(srcAmount, 6) / +formatUnits(dstAmount, 18)

    expect(price).to.equal(2462.2959342765034)
  })

  test('should swap by AquaPeggedAmmStrategy 1bps flat fees USDC -> DAI', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.swapVMAquaRouter))

    const USDC = new Address(ADDRESSES.USDC)
    const DAI = new Address(ADDRESSES.DAI)

    const amountsAndTokens = [
      {
        amount: parseUnits('100000', 6),
        token: USDC,
      },
      {
        amount: parseUnits('100000', 18),
        token: DAI,
      },
    ]

    const program = AquaPeggedAmmStrategy.new({
      tokenA: {
        address: amountsAndTokens[0].token,
        decimals: 6,
        reserve: amountsAndTokens[0].amount,
      },
      tokenB: {
        address: amountsAndTokens[1].token,
        decimals: 18,
        reserve: amountsAndTokens[1].amount,
      },
      linearWidth: 8n * 10n ** 26n,
    })
      .withFeeTokenIn(1)
      .build()

    const order = Order.new({
      maker: new Address(liqProviderAddress),
      program,
      traits: MakerTraits.default(),
    })

    const strategyHash = order
      .hash({
        chainId: forkNode.chainId as NetworkEnum,
        name: 'TestAquaSwapVMRouter',
        version: '1.0',
        verifyingContract: new Address(forkNode.addresses.swapVMAquaRouter),
      })
      .toString()

    const tx = aqua.ship({
      app: new Address(forkNode.addresses.swapVMAquaRouter),
      strategy: order.encode(),
      amountsAndTokens,
    })

    await liquidityProvider.send(tx)

    const srcAmount = parseUnits('2500', 6)

    const swapParams = {
      order,
      amount: srcAmount,
      takerTraits: TakerTraits.default(),
      tokenIn: USDC,
      tokenOut: DAI,
    }

    // Simulate the call to get the dstAmount
    const simulateResult = await forkNode.provider.call({
      account: swapperAddress,
      ...swapVM.quote(swapParams),
    })

    const [_, dstAmount] = decodeFunctionResult({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      data: simulateResult.data!,
    })

    const swap = swapVM.swap(swapParams)

    await trackBalances(
      swapper,
      strategyHash,
      swapParams.tokenIn,
      swapParams.tokenOut,
      swapParams.amount,
      dstAmount,
      async () => {
        const { txHash } = await swapper.send({ ...swap, allowFail: false })

        // await forkNode.printTrace(txHash)
        return txHash
      },
    )

    const price = +formatUnits(srcAmount, 6) / +formatUnits(dstAmount, 18)

    expect(price).to.equal(1.0049082608028008)
  })

  test('should swap by AquaXYCAmmStrategy with protocol fee', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.swapVMAquaRouter))

    const USDC = new Address(ADDRESSES.USDC)
    const WETH = new Address(ADDRESSES.WETH)

    const protocolAddress = Address.fromBigInt(0xdeadbeefn)

    const feeBps = 100
    const program = AquaXYCAmmStrategy.new().withProtocolFee(feeBps, protocolAddress).build()

    const order = Order.new({
      maker: new Address(liqProviderAddress),
      program,
      traits: MakerTraits.default(),
    })

    const strategyHash = order
      .hash({
        chainId: forkNode.chainId as NetworkEnum,
        name: 'TestAquaSwapVMRouter',
        version: '1.0',
        verifyingContract: new Address(forkNode.addresses.swapVMAquaRouter),
      })
      .toString()

    const tx = aqua.ship({
      app: new Address(forkNode.addresses.swapVMAquaRouter),
      strategy: order.encode(),
      amountsAndTokens: [
        {
          amount: parseUnits('10000', 6),
          token: USDC,
        },
        {
          amount: parseUnits('5', 18),
          token: WETH,
        },
      ],
    })

    await liquidityProvider.send(tx)

    const providerWethBalanceBefore = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.swapVMAquaRouter,
      strategyHash,
      ADDRESSES.WETH,
    )
    const providerUsdcBalanceBefore = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.swapVMAquaRouter,
      strategyHash,
      ADDRESSES.USDC,
    )
    const swapperWethBalanceBefore = await swapper.tokenBalance(ADDRESSES.WETH)
    const swapperUsdcBalanceBefore = await swapper.tokenBalance(ADDRESSES.USDC)
    const protocol = await forkNode.walletForAddress(protocolAddress.toString())
    const protocolUsdcBalanceBefore = await protocol.tokenBalance(ADDRESSES.USDC)

    const srcAmount = parseUnits('100', 6)

    const swapParams = {
      order,
      amount: srcAmount,
      takerTraits: TakerTraits.default(),
      tokenIn: USDC,
      tokenOut: WETH,
    }

    // Simulate the call to get the dstAmount
    const simulateResult = await forkNode.provider.call({
      account: swapperAddress,
      ...swapVM.quote(swapParams),
    })

    const [quotedSrcAmount, dstAmount] = decodeFunctionResult({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      data: simulateResult.data!,
    })

    const swap = swapVM.swap(swapParams)

    const { txHash: _swapTx } = await swapper.send({ ...swap, allowFail: false })
    // await forkNode.printTrace(swapTx)

    const providerWethBalanceAfter = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.swapVMAquaRouter,
      strategyHash,
      ADDRESSES.WETH,
    )
    const providerUsdcBalanceAfter = await getAquaBalance(
      liqProviderAddress,
      forkNode.addresses.swapVMAquaRouter,
      strategyHash,
      ADDRESSES.USDC,
    )
    const protocolUsdcBalanceAfter = await protocol.tokenBalance(ADDRESSES.USDC)

    const protocolFee = (quotedSrcAmount * 1n) / 100n // 100 bps = 1%
    expect(protocolUsdcBalanceAfter - protocolUsdcBalanceBefore).to.equal(protocolFee)

    expect(providerWethBalanceAfter).to.equal(providerWethBalanceBefore - dstAmount)
    expect(providerUsdcBalanceAfter).to.equal(providerUsdcBalanceBefore + srcAmount - protocolFee)

    const swapperWethBalanceAfter = await swapper.tokenBalance(ADDRESSES.WETH)
    const swapperUsdcBalanceAfter = await swapper.tokenBalance(ADDRESSES.USDC)
    expect(swapperWethBalanceAfter).to.equal(swapperWethBalanceBefore + dstAmount)
    expect(swapperUsdcBalanceAfter).to.equal(swapperUsdcBalanceBefore - srcAmount)
  })

  test('should swap with custom swap vm', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper
    const otherSwapperAddress = '0xff989b7f90e304033f692c9b6613a70458d3df22'
    const otherSwapper = await forkNode.walletForAddress(otherSwapperAddress)

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.customSwapVM))

    const USDC = new Address(ADDRESSES.USDC)
    const WETH = new Address(ADDRESSES.WETH)
    await swapper.unlimitedApprove(USDC.toString(), swapVM.address.toString())
    await swapper.transferToken(USDC.toString(), otherSwapperAddress, parseUnits('100', 6))
    await otherSwapper.unlimitedApprove(USDC.toString(), swapVM.address.toString())

    class OnlyAllowedTakerArgs implements instructions.IArgsData {
      constructor(public readonly allowedTaker: Address) {}

      toJSON(): Record<string, unknown> | null {
        return { allowedTaker: this.allowedTaker.toString() }
      }
    }

    class OnlyAllowedTakerCoder implements instructions.IArgsCoder<OnlyAllowedTakerArgs> {
      encode(args: OnlyAllowedTakerArgs): HexString {
        return new HexString(args.allowedTaker.toString())
      }

      decode(data: HexString): OnlyAllowedTakerArgs {
        return new OnlyAllowedTakerArgs(Address.fromBigInt(data.toBigInt()))
      }
    }

    const onlyAllowedTaker = new Opcode(
      Symbol('Custom.onlyAllowedTaker'),
      new OnlyAllowedTakerCoder(),
    )
    const { xycSwap } = instructions

    const instructionsSet = [xycSwap.xycSwapXD, onlyAllowedTaker]
    const program = new ProgramBuilder(instructionsSet)
      .add(xycSwap.xycSwapXD.createIx(new xycSwap.XycSwapXDArgs()))
      .add(onlyAllowedTaker.createIx(new OnlyAllowedTakerArgs(new Address(swapperAddress))))
      .build()

    const order = Order.new({
      maker: new Address(liqProviderAddress),
      program,
      traits: MakerTraits.default(),
    })

    const strategyHash = order
      .hash({
        chainId: forkNode.chainId as NetworkEnum,
        name: 'TestCustomSwapVM',
        version: '1.0',
        verifyingContract: swapVM.address,
      })
      .toString()

    const tx = aqua.ship({
      app: swapVM.address,
      strategy: order.encode(),
      amountsAndTokens: [
        {
          amount: parseUnits('10000', 6),
          token: USDC,
        },
        {
          amount: parseUnits('5', 18),
          token: WETH,
        },
      ],
    })

    await liquidityProvider.send(tx)

    const providerWethBalanceBefore = await getAquaBalance(
      liqProviderAddress,
      swapVM.address.toString(),
      strategyHash,
      ADDRESSES.WETH,
    )
    const providerUsdcBalanceBefore = await getAquaBalance(
      liqProviderAddress,
      swapVM.address.toString(),
      strategyHash,
      ADDRESSES.USDC,
    )
    const swapperWethBalanceBefore = await swapper.tokenBalance(ADDRESSES.WETH)
    const swapperUsdcBalanceBefore = await swapper.tokenBalance(ADDRESSES.USDC)

    const srcAmount = parseUnits('100', 6)

    const swapParams = {
      order,
      amount: srcAmount,
      takerTraits: TakerTraits.default(),
      tokenIn: USDC,
      tokenOut: WETH,
    }

    // Simulate the call to get the dstAmount
    const simulateResult = await forkNode.provider.call({
      account: swapperAddress,
      ...swapVM.quote(swapParams),
    })

    const [_, dstAmount] = decodeFunctionResult({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      data: simulateResult.data!,
    })

    const swap = swapVM.swap(swapParams)

    await swapper.send(swap)

    const providerWethBalanceAfter = await getAquaBalance(
      liqProviderAddress,
      swapVM.address.toString(),
      strategyHash,
      ADDRESSES.WETH,
    )
    const providerUsdcBalanceAfter = await getAquaBalance(
      liqProviderAddress,
      swapVM.address.toString(),
      strategyHash,
      ADDRESSES.USDC,
    )

    expect(providerWethBalanceAfter).to.equal(providerWethBalanceBefore - dstAmount)
    expect(providerUsdcBalanceAfter).to.equal(providerUsdcBalanceBefore + srcAmount)

    const swapperWethBalanceAfter = await swapper.tokenBalance(ADDRESSES.WETH)
    const swapperUsdcBalanceAfter = await swapper.tokenBalance(ADDRESSES.USDC)
    expect(swapperWethBalanceAfter).to.equal(swapperWethBalanceBefore + dstAmount)
    expect(swapperUsdcBalanceAfter).to.equal(swapperUsdcBalanceBefore - srcAmount)

    await expect(() =>
      forkNode.provider.call({
        account: otherSwapperAddress,
        ...swapVM.quote(swapParams),
      }),
    ).rejects.toThrow('0xf774ea08') // TakerNotAllowed()
  })

  test('should call maker hooks on external contract', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.swapVMAquaRouter))

    const USDC = new Address(ADDRESSES.USDC)
    const WETH = new Address(ADDRESSES.WETH)

    const program = AquaXYCAmmStrategy.new().build()

    const makerHooksTarget = new Address(forkNode.addresses.makerHooks)
    const order = Order.new({
      maker: new Address(liqProviderAddress),
      program,
      traits: MakerTraits.default().with({
        preTransferInHook: new Interaction(makerHooksTarget, new HexString(toHex('preTransferIn'))),
        preTransferOutHook: new Interaction(
          makerHooksTarget,
          new HexString(toHex('preTransferOut')),
        ),
        postTransferInHook: new Interaction(
          makerHooksTarget,
          new HexString(toHex('postTransferIn')),
        ),
        postTransferOutHook: new Interaction(
          makerHooksTarget,
          new HexString(toHex('postTransferOut')),
        ),
      }),
    })

    const strategyHash = order
      .hash({
        chainId: forkNode.chainId as NetworkEnum,
        name: 'TestAquaSwapVMRouter',
        version: '1.0',
        verifyingContract: new Address(forkNode.addresses.swapVMAquaRouter),
      })
      .toString()

    const tx = aqua.ship({
      app: new Address(forkNode.addresses.swapVMAquaRouter),
      strategy: order.encode(),
      amountsAndTokens: [
        {
          amount: parseUnits('10000', 6),
          token: USDC,
        },
        {
          amount: parseUnits('5', 18),
          token: WETH,
        },
      ],
    })

    await liquidityProvider.send(tx)

    const srcAmount = parseUnits('100', 6)

    const swapParams = {
      order,
      amount: srcAmount,
      takerTraits: TakerTraits.default().with({
        preTransferInHookData: new HexString(toHex('preTransferIn')),
        preTransferOutHookData: new HexString(toHex('preTransferOut')),
        postTransferInHookData: new HexString(toHex('postTransferIn')),
        postTransferOutHookData: new HexString(toHex('postTransferOut')),
      }),
      tokenIn: USDC,
      tokenOut: WETH,
    }

    // Simulate the call to get the dstAmount
    const simulateResult = await swapper.provider.call(swapVM.quote(swapParams))

    const [_, dstAmount] = decodeFunctionResult({
      abi: SWAP_VM_ABI,
      functionName: 'quote',
      data: simulateResult.data!,
    })

    const swap = swapVM.swap(swapParams)

    const swapTxHash = await trackBalances(
      swapper,
      strategyHash,
      swapParams.tokenIn,
      swapParams.tokenOut,
      swapParams.amount,
      dstAmount,
      async () => {
        const { txHash } = await swapper.send({ ...swap, allowFail: false })

        // await forkNode.printTrace(txHash)
        return txHash
      },
    )

    const txReceipt = await forkNode.provider.getTransactionReceipt({ hash: swapTxHash })

    const logsFromHooks = txReceipt.logs.filter(
      (l) => l.address.toLowerCase() === makerHooksTarget.toString(),
    )

    expect(logsFromHooks.length).toBe(4)

    const hooksAbi = [
      {
        type: 'event',
        name: 'HookCalled',
        inputs: [
          {
            name: 'name',
            type: 'string',
            indexed: false,
            internalType: 'string',
          },
          {
            name: 'makerData',
            type: 'bytes',
            indexed: false,
            internalType: 'bytes',
          },
          {
            name: 'takerData',
            type: 'bytes',
            indexed: false,
            internalType: 'bytes',
          },
        ],
      },
    ] as const

    const events = logsFromHooks.map((l) =>
      decodeEventLog({ abi: hooksAbi, topics: l.topics, data: l.data, eventName: 'HookCalled' }),
    )

    for (const event of events) {
      expect(event.args.makerData).toEqual(toHex(event.args.name))
      expect(event.args.takerData).toEqual(toHex(event.args.name))
    }
  })
})
