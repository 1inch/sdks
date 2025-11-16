// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { Address, NetworkEnum } from '@1inch/sdk-core'

/**
 * Aqua Protocol contract addresses by chain ID
 */
export const AQUA_CONTRACT_ADDRESSES: Record<NetworkEnum, Address> = {
  [NetworkEnum.ETHEREUM]: new Address('0x407bb6447c1328f41ebb2d3cc018c54158775159'),
  [NetworkEnum.BINANCE]: new Address('0x68d16542c60c1affae3a18896c1ad01c969c652f'),
  [NetworkEnum.POLYGON]: new Address('0x0d5c0881cba1a88a6ebf90e89a25ecd2506bb967'),
  [NetworkEnum.ARBITRUM]: new Address('0x68d16542c60c1affae3a18896c1ad01c969c652f'),
  [NetworkEnum.AVALANCHE]: new Address('0x68d16542c60c1affae3a18896c1ad01c969c652f'),
  [NetworkEnum.GNOSIS]: new Address('0x68d16542c60c1affae3a18896c1ad01c969c652f'),
  [NetworkEnum.COINBASE]: new Address('0xa7868b134f447914dd60c0984889ac57ddaa1a21'),
  [NetworkEnum.OPTIMISM]: new Address('0x0d5c0881cba1a88a6ebf90e89a25ecd2506bb967'),
  [NetworkEnum.ZKSYNC]: new Address('0x68d16542c60c1affae3a18896c1ad01c969c652f'),
  [NetworkEnum.LINEA]: new Address('0x68d16542c60c1affae3a18896c1ad01c969c652f'),
  [NetworkEnum.UNICHAIN]: new Address('0x68d16542c60c1affae3a18896c1ad01c969c652f'),
  [NetworkEnum.SONIC]: new Address('0x68d16542c60c1affae3a18896c1ad01c969c652f'),
}
