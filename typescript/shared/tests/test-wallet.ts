import ERC20 from '@contracts/SafeERC20.sol/SafeERC20.json'
import {
  Transport,
  Account,
  Hex,
  TypedDataDefinition,
  WalletClient,
  PublicClient,
  createWalletClient,
  createPublicClient,
  createTestClient,
  encodeFunctionData,
  getAddress,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

export class TestWallet {
  public provider: WalletClient<Transport, any, Account>
  private account: Account
  private transport: Transport
  private publicClient: PublicClient<Transport>

  constructor(
    privateKeyOrSigner: string | Account,
    transport: Transport
  ) {
    this.account = typeof privateKeyOrSigner === 'string'
      ? privateKeyToAccount(privateKeyOrSigner as Hex)
      : privateKeyOrSigner

    this.transport = transport
    this.provider = createWalletClient({
      transport,
      account: this.account,
    }) as WalletClient<Transport, any, Account>
    this.publicClient = createPublicClient({ transport })
  }

  static async signTypedData(
    account: Account,
    typedData: TypedDataDefinition
  ): Promise<Hex> {
    if (!account.signTypedData) {
      throw new Error('Account does not support signing typed data')
    }
    return await account.signTypedData(typedData)
  }

  public static async fromAddress(
    address: Hex,
    transport: Transport
  ): Promise<TestWallet> {
    const client = createTestClient({
      transport,
      mode: 'anvil',
    })

    await client.impersonateAccount({
      address,
    })

    return new TestWallet(address, transport)
  }

  async tokenBalance(token: string): Promise<bigint> {
    const userAddress = await this.getAddress()

    const balance = await this.publicClient.readContract({
      address: getAddress(token),
      abi: ERC20.abi as any,
      functionName: 'balanceOf',
      args: [userAddress],
    }) as bigint

    return balance
  }

  public async nativeBalance(): Promise<bigint> {
    const address = await this.getAddress()
    return this.publicClient.getBalance({ address })
  }

  async topUpFromDonor(
    token: string,
    donor: string,
    amount: bigint
  ): Promise<void> {
    const donorWallet = await TestWallet.fromAddress(donor as Hex, this.transport)
    await donorWallet.transferToken(token, await this.getAddress(), amount)
  }

  public async getAddress(): Promise<Hex> {
    return this.account.address
  }

  public async unlimitedApprove(
    tokenAddress: string,
    spender: string
  ): Promise<void> {
    const currentApprove = await this.getAllowance(tokenAddress, spender)

    // for usdt like tokens
    if (currentApprove !== 0n) {
      await this.approveToken(tokenAddress, spender, 0n)
    }

    await this.approveToken(tokenAddress, spender, (1n << 256n) - 1n)
  }

  public async getAllowance(token: string, spender: string): Promise<bigint> {
    const userAddress = await this.getAddress()

    const allowance = await this.publicClient.readContract({
      address: getAddress(token),
      abi: ERC20.abi as any,
      functionName: 'allowance',
      args: [userAddress, getAddress(spender)],
    }) as bigint

    return allowance
  }

  public async transfer(dest: string, amount: bigint): Promise<void> {
    await this.provider.sendTransaction({
      to: getAddress(dest),
      value: amount,
    } as any)
  }

  public async transferToken(
    token: string,
    dest: string,
    amount: bigint
  ): Promise<void> {
    const data = encodeFunctionData({
      abi: ERC20.abi as any,
      functionName: 'transfer',
      args: [getAddress(dest), amount],
    })

    await this.provider.sendTransaction({
      to: getAddress(token),
      data,
      gas: 1_000_000n,
    } as any)
  }

  public async approveToken(
    token: string,
    spender: string,
    amount: bigint
  ): Promise<void> {
    const data = encodeFunctionData({
      abi: ERC20.abi as any,
      functionName: 'approve',
      args: [getAddress(spender), amount],
    })

    await this.provider.sendTransaction({
      to: getAddress(token),
      data,
    } as any)
  }

  public async signTypedData(typedData: TypedDataDefinition): Promise<Hex> {
    return TestWallet.signTypedData(this.account, typedData)
  }

  async send(
    param: any
  ): Promise<{ txHash: Hex; blockTimestamp: bigint; blockHash: Hex }> {
    const hash = await this.provider.sendTransaction({
      ...param,
      gas: 10_000_000n,
    } as any)

    const receipt = await this.publicClient.getTransactionReceipt({ hash })

    if (!receipt) {
      throw new Error('Transaction receipt not found')
    }

    if (receipt.status !== 'success') {
      throw new Error('Transaction failed')
    }

    const block = await this.publicClient.getBlock({ blockHash: receipt.blockHash })

    return {
      txHash: receipt.transactionHash,
      blockTimestamp: block.timestamp,
      blockHash: receipt.blockHash,
    }
  }
}
