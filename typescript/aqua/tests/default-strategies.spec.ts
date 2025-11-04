import { Address, HexString } from '@1inch/sdk-shared'
import { encodeAbiParameters, Hex, parseUnits } from 'viem'
import { ReadyEvmFork, setupEvm } from './setup-evm'
import { ADDRESSES } from './constants'

import { AquaProtocolContract } from '../src/aqua-protocol-contract'
import { AquaABI } from '../src/abi/Aqua.abi'

describe('Default Strategies', () => {
  let forkNode: ReadyEvmFork

  const getBalance = async (maker: Address | Hex, app: Address | Hex, strategyHash: Hex, token: Address | Hex): Promise<bigint> => {
    return forkNode.provider.readContract({
      address: forkNode.addresses.aqua,
      abi: AquaABI,
      functionName: 'balances',
      args: [maker.toString() as Hex, app.toString() as Hex, strategyHash, token.toString() as Hex]
    })
  }
  beforeAll(async () => {
    forkNode = await setupEvm({ chainId: 1 })
  })

  test('should be able to ship basic strategy', async () => {
    const liquidityProvider = forkNode.liqProvider
    const liqProviderAddress = await liquidityProvider.getAddress()
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
      [
        {
          maker: liqProviderAddress,
          token0: ADDRESSES.WETH,
          token1: ADDRESSES.USDC,
          feeBps: 0n,
          salt: '0x0000000000000000000000000000000000000000000000000000000000000001',
        },
      ],
    )

    const strategyHash = AquaProtocolContract.calculateStrategyHash(new HexString(strategy)).toString()

    const wethBalanceBefore = await getBalance(liqProviderAddress, forkNode.addresses.xycSwap, strategyHash, ADDRESSES.WETH)
    const usdcBalanceBefore = await getBalance(liqProviderAddress, forkNode.addresses.xycSwap, strategyHash, ADDRESSES.USDC)

    const usdcAmount = parseUnits('1000', 6)
    const wethAmount = parseUnits('1', 18)


    const tx = new AquaProtocolContract(new Address(forkNode.addresses.aqua)).ship({
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

    const wethBalanceAfter = await getBalance(liqProviderAddress, forkNode.addresses.xycSwap, strategyHash, ADDRESSES.WETH)
    const usdcBalanceAfter = await getBalance(liqProviderAddress, forkNode.addresses.xycSwap, strategyHash, ADDRESSES.USDC)

    expect(wethBalanceAfter).to.equal(wethBalanceBefore + wethAmount)
    expect(usdcBalanceAfter).to.equal(usdcBalanceBefore + usdcAmount)
  })
})
