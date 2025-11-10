import 'dotenv/config'
import { Address, NetworkEnum } from '@1inch/sdk-shared'
import { ADDRESSES } from '@1inch/sdk-shared/test-utils'
import { Hex, parseUnits } from 'viem'
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

    const tx = aqua.ship({
      app: new Address(forkNode.addresses.aqua),
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

    const swap = swapVM.swap({
      order,
      amount: parseUnits('100', 6),
      takerTraits: TakerTraits.default(),
      tokenIn: USDC,
      tokenOut: WETH,
    })

    const { txHash: swapTx } = await swapper.send({ ...swap, allowFail: true })
    await forkNode.printTrace(swapTx)
  })
})
