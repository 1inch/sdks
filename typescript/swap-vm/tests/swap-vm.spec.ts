/* eslint-disable max-lines-per-function */
import 'dotenv/config'
import { Address, NetworkEnum } from '@1inch/sdk-core'
import { ADDRESSES } from '@1inch/sdk-core/test-utils'
import { decodeFunctionResult, Hex, parseUnits } from 'viem'
import { ABI, AquaProtocolContract } from '@1inch/aqua-sdk'
import { ReadyEvmFork } from './setup-evm.js'
import { Order } from '../src/swap-vm/order.js'
import { MakerTraits } from '../src/swap-vm/maker-traits.js'
import { AquaAMMStrategy, AquaProgramBuilder, SwapVMContract, TakerTraits } from '../src'
import { SWAP_VM_ABI } from '../src/abi/SwapVM.abi.js'

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
    return forkNode.provider.readContract({
      address: forkNode.addresses.aqua,
      abi: ABI.AQUA_ABI,
      functionName: 'balances',
      args: [maker.toString() as Hex, app.toString() as Hex, strategyHash, token.toString() as Hex],
    })
  }

  beforeAll(async () => {
    forkNode = await ReadyEvmFork.setup({ chainId: 1 })
    liqProviderAddress = await forkNode.liqProvider.getAddress()
    swapperAddress = await forkNode.swapper.getAddress()
  })

  test('should correct calculate order hash', async () => {
    const program = new AquaProgramBuilder()
      .concentrateGrowLiquidity2D({ deltaGt: 1n, deltaLt: 2n })
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
      functionName: 'hashOrder',
      args: [
        {
          maker: order.maker.toString(),
          program: order.program.toString(),
          traits: order.traits.asBigInt(),
        },
      ],
    })

    expect(calculatedHash.toString()).toEqual(hashFromContract)
  })

  test('should swap by AquaAMMStrategy', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.swapVMAquaRouter))

    const USDC = new Address(ADDRESSES.USDC)
    const WETH = new Address(ADDRESSES.WETH)

    const program = AquaAMMStrategy.new({
      tokenA: USDC,
      tokenB: WETH,
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
      strategy: order.abiEncode(),
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

    expect(providerWethBalanceAfter).to.equal(providerWethBalanceBefore - dstAmount)
    expect(providerUsdcBalanceAfter).to.equal(providerUsdcBalanceBefore + srcAmount)

    const swapperWethBalanceAfter = await swapper.tokenBalance(ADDRESSES.WETH)
    const swapperUsdcBalanceAfter = await swapper.tokenBalance(ADDRESSES.USDC)
    expect(swapperWethBalanceAfter).to.equal(swapperWethBalanceBefore + dstAmount)
    expect(swapperUsdcBalanceAfter).to.equal(swapperUsdcBalanceBefore - srcAmount)
  })

  test('should swap by AquaAMMStrategy with protocol fee', async () => {
    const liquidityProvider = forkNode.liqProvider
    const swapper = forkNode.swapper

    const aqua = new AquaProtocolContract(new Address(forkNode.addresses.aqua))
    const swapVM = new SwapVMContract(new Address(forkNode.addresses.swapVMAquaRouter))

    const USDC = new Address(ADDRESSES.USDC)
    const WETH = new Address(ADDRESSES.WETH)

    const protocolAddress = Address.fromBigInt(0xdeadbeefn)

    const feeBps = 100
    const program = AquaAMMStrategy.new({
      tokenA: USDC,
      tokenB: WETH,
    })
      .withProtocolFee(feeBps, protocolAddress)
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
      strategy: order.abiEncode(),
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
    const protocolWethBalanceBefore = await protocol.tokenBalance(ADDRESSES.WETH)

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
    const protocolWethBalanceAfter = await protocol.tokenBalance(ADDRESSES.WETH)

    const protocolFee = dstAmount / 99n // 100 bps = 1%
    expect(protocolWethBalanceAfter - protocolWethBalanceBefore).to.equal(protocolFee)

    expect(providerWethBalanceAfter).to.equal(providerWethBalanceBefore - dstAmount - protocolFee)
    expect(providerUsdcBalanceAfter).to.equal(providerUsdcBalanceBefore + srcAmount)

    const swapperWethBalanceAfter = await swapper.tokenBalance(ADDRESSES.WETH)
    const swapperUsdcBalanceAfter = await swapper.tokenBalance(ADDRESSES.USDC)
    expect(swapperWethBalanceAfter).to.equal(swapperWethBalanceBefore + dstAmount)
    expect(swapperUsdcBalanceAfter).to.equal(swapperUsdcBalanceBefore - srcAmount)
  })
})
