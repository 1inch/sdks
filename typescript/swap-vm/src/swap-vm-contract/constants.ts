import { Address, NetworkEnum } from '@1inch/sdk-core'

/**
 * AquaSwapVM contract addresses by chain ID
 * These addresses supports only AQUA instructions set
 *
 * @see "../swap-vm/programs/aqua-program-builder"
 */
export const AQUA_SWAP_VM_CONTRACT_ADDRESSES: Record<NetworkEnum, Address> = {
  [NetworkEnum.ETHEREUM]: new Address('0x1384a4d41235bc579e5b28355da64bf1287abdac'),
  [NetworkEnum.BINANCE]: new Address('0x0d5c0881cba1a88a6ebf90e89a25ecd2506bb967'),
  [NetworkEnum.POLYGON]: new Address('0xaa64d89e264455ea9eff7416b58cae3f6d84ceb5'),
  [NetworkEnum.ARBITRUM]: new Address('0x0d5c0881cba1a88a6ebf90e89a25ecd2506bb967'),
  [NetworkEnum.AVALANCHE]: new Address('0x0d5c0881cba1a88a6ebf90e89a25ecd2506bb967'),
  [NetworkEnum.GNOSIS]: new Address('0x0d5c0881cba1a88a6ebf90e89a25ecd2506bb967'),
  [NetworkEnum.COINBASE]: new Address('0xcc4fee4ff03daf14e8ba6c71910b4e078f3d1c6b'),
  [NetworkEnum.OPTIMISM]: new Address('0xaa64d89e264455ea9eff7416b58cae3f6d84ceb5'),
  [NetworkEnum.ZKSYNC]: new Address('0x0d5c0881cba1a88a6ebf90e89a25ecd2506bb967'),
  [NetworkEnum.LINEA]: new Address('0x0d5c0881cba1a88a6ebf90e89a25ecd2506bb967'),
  [NetworkEnum.UNICHAIN]: new Address('0x0d5c0881cba1a88a6ebf90e89a25ecd2506bb967'),
  [NetworkEnum.SONIC]: new Address('0x0d5c0881cba1a88a6ebf90e89a25ecd2506bb967'),
}
