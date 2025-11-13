import type {
  Transport,
  Account,
  Hex,
  TypedDataDefinition,
  Chain,
  Prettify,
  Client,
  PublicActions,
  RpcSchema,
  WalletActions,
  WalletRpcSchema,
} from 'viem'
import {
  createWalletClient,
  createTestClient,
  encodeFunctionData,
  getAddress,
  isAddress,
  publicActions,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import type { CallInfo } from '../types/tx.js'
import { ERC20_ABI } from '../abi/ERC20.abi.js'

export class TestWallet {
  public provider: _Client

  public transport: Transport

  private account: Account

  constructor(
    privateKeyOrAddress: Hex,
    transport: Transport,
    public readonly chain: Chain,
  ) {
    this.account =
      typeof privateKeyOrAddress === 'string' && !isAddress(privateKeyOrAddress)
        ? privateKeyToAccount(privateKeyOrAddress)
        : { type: 'json-rpc', address: privateKeyOrAddress }

    this.transport = transport
    this.provider = createWalletClient({
      transport,
      account: this.account,
      chain,
    }).extend(publicActions) as _Client
  }

  static async signTypedData(account: Account, typedData: TypedDataDefinition): Promise<Hex> {
    if (!account.signTypedData) {
      throw new Error('Account does not support signing typed data')
    }

    return await account.signTypedData(typedData)
  }

  public static async fromAddress(
    address: Hex,
    transport: Transport,
    chain: Chain,
  ): Promise<TestWallet> {
    const client = createTestClient({
      transport,
      mode: 'anvil',
    })

    await client.impersonateAccount({
      address,
    })

    return new TestWallet(address, transport, chain)
  }

  async tokenBalance(token: string): Promise<bigint> {
    const userAddress = await this.getAddress()

    const balance = (await this.provider.readContract({
      address: getAddress(token),
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    })) as bigint

    return balance
  }

  public async nativeBalance(): Promise<bigint> {
    const address = await this.getAddress()

    return this.provider.getBalance({ address })
  }

  async topUpFromDonor(token: string, donor: string, amount: bigint): Promise<void> {
    const donorWallet = await TestWallet.fromAddress(donor as Hex, this.transport, this.chain)
    await donorWallet.transferToken(token, await this.getAddress(), amount)
  }

  public async getAddress(): Promise<Hex> {
    return this.account.address
  }

  public async unlimitedApprove(tokenAddress: string, spender: string): Promise<void> {
    const currentApprove = await this.getAllowance(tokenAddress, spender)

    // for usdt like tokens
    if (currentApprove !== 0n) {
      await this.approveToken(tokenAddress, spender, 0n)
    }

    await this.approveToken(tokenAddress, spender, (1n << 256n) - 1n)
  }

  public async getAllowance(token: string, spender: string): Promise<bigint> {
    const userAddress = await this.getAddress()

    const allowance = (await this.provider.readContract({
      address: token as Hex,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress, spender as Hex],
    })) as bigint

    return allowance
  }

  public async transfer(dest: string, amount: bigint): Promise<void> {
    await this.provider.sendTransaction({
      to: dest as Hex,
      value: amount,
    } as any)
  }

  public async transferToken(token: string, dest: string, amount: bigint): Promise<void> {
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [dest as Hex, amount],
    })

    await this.provider.sendTransaction({
      to: token as Hex,
      data,
      gas: 1_000_000n,
    } as any)
  }

  public async approveToken(token: string, spender: string, amount: bigint): Promise<void> {
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender as Hex, amount],
    })

    await this.provider.sendTransaction({
      to: token as Hex,
      data,
    } as any)
  }

  public async signTypedData(typedData: TypedDataDefinition): Promise<Hex> {
    return TestWallet.signTypedData(this.account, typedData)
  }

  async send(
    param: CallInfo & { allowFail?: boolean },
  ): Promise<{ txHash: Hex; blockTimestamp: bigint; blockHash: Hex }> {
    const hash = await this.provider.sendTransaction({
      ...param,
      chain: this.provider.chain,
      gas: 10_000_000n,
    })

    const receipt = await this.provider.waitForTransactionReceipt({ hash })

    if (!receipt) {
      throw new Error('Transaction receipt not found')
    }

    if (receipt.status !== 'success' && !param.allowFail) {
      throw new Error('Transaction failed')
    }

    const block = await this.provider.getBlock({ blockHash: receipt.blockHash })

    return {
      txHash: receipt.transactionHash,
      blockTimestamp: block.timestamp,
      blockHash: receipt.blockHash,
    }
  }
}

type _Client<
  chain extends Chain = Chain,
  account extends Account = Account,
  transport extends Transport = Transport,
  rpcSchema extends RpcSchema = RpcSchema,
> = Prettify<
  Client<
    transport,
    chain,
    account,
    rpcSchema extends RpcSchema ? [...WalletRpcSchema, ...rpcSchema] : WalletRpcSchema,
    WalletActions<chain, account> & PublicActions<transport, chain, account>
  >
>
