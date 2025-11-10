import 'dotenv/config'
import { Address, NetworkEnum } from '@1inch/sdk-shared'
import { Hex } from 'viem'
import { ABI } from '@1inch/aqua-sdk'
import { ReadyEvmFork, setupEvm } from './setup-evm.js'
import { Order } from '../src/swap-vm/order.js'
import { MakerTraits } from '../src/swap-vm/maker-traits.js'
import { AquaProgramBuilder } from '../src'
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
    forkNode = await setupEvm({ chainId: 1 })
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
  
  test('should ')
})
