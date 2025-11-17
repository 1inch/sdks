// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { Address, NetworkEnum } from '@1inch/sdk-core'

/**
 * Aqua Protocol contract addresses by chain ID
 */
export const AQUA_CONTRACT_ADDRESSES: Record<NetworkEnum, Address> = {
  [NetworkEnum.ETHEREUM]: new Address('0x499943e74fb0ce105688beee8ef2abec5d936d31'),
  [NetworkEnum.BINANCE]: new Address('0x499943e74fb0ce105688beee8ef2abec5d936d31'),
  [NetworkEnum.POLYGON]: new Address('0x499943e74fb0ce105688beee8ef2abec5d936d31'),
  [NetworkEnum.ARBITRUM]: new Address('0x499943e74fb0ce105688beee8ef2abec5d936d31'),
  [NetworkEnum.AVALANCHE]: new Address('0x499943e74fb0ce105688beee8ef2abec5d936d31'),
  [NetworkEnum.GNOSIS]: new Address('0x499943e74fb0ce105688beee8ef2abec5d936d31'),
  [NetworkEnum.COINBASE]: new Address('0x499943e74fb0ce105688beee8ef2abec5d936d31'),
  [NetworkEnum.OPTIMISM]: new Address('0x499943e74fb0ce105688beee8ef2abec5d936d31'),
  [NetworkEnum.ZKSYNC]: new Address('0x499943e74fb0ce105688beee8ef2abec5d936d31'),
  [NetworkEnum.LINEA]: new Address('0x499943e74fb0ce105688beee8ef2abec5d936d31'),
  [NetworkEnum.UNICHAIN]: new Address('0x499943e74fb0ce105688beee8ef2abec5d936d31'),
  [NetworkEnum.SONIC]: new Address('0x499943e74fb0ce105688beee8ef2abec5d936d31'),
}
