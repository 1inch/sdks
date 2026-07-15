// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { Address, NetworkEnum } from '@1inch/sdk-core'

/**
 * Aqua Protocol contract addresses by chain ID
 */
export const AQUA_CONTRACT_ADDRESSES: Record<NetworkEnum, Address> = {
  [NetworkEnum.ETHEREUM]: new Address('0x4a055aa172c98ec32de118b9b5b6ac8b4099a580'),
  [NetworkEnum.BINANCE]: new Address('0x4a055aa172c98ec32de118b9b5b6ac8b4099a580'),
  [NetworkEnum.POLYGON]: new Address('0x4a055aa172c98ec32de118b9b5b6ac8b4099a580'),
  [NetworkEnum.ARBITRUM]: new Address('0x4a055aa172c98ec32de118b9b5b6ac8b4099a580'),
  [NetworkEnum.AVALANCHE]: new Address('0x4a055aa172c98ec32de118b9b5b6ac8b4099a580'),
  [NetworkEnum.GNOSIS]: new Address('0x4a055aa172c98ec32de118b9b5b6ac8b4099a580'),
  [NetworkEnum.COINBASE]: new Address('0x4a055aa172c98ec32de118b9b5b6ac8b4099a580'),
  [NetworkEnum.OPTIMISM]: new Address('0x4a055aa172c98ec32de118b9b5b6ac8b4099a580'),
  [NetworkEnum.ZKSYNC]: new Address('0x4a055aa172c98ec32de118b9b5b6ac8b4099a580'),
  [NetworkEnum.LINEA]: new Address('0x4a055aa172c98ec32de118b9b5b6ac8b4099a580'),
  [NetworkEnum.UNICHAIN]: new Address('0x4a055aa172c98ec32de118b9b5b6ac8b4099a580'),
  [NetworkEnum.SONIC]: new Address('0x4a055aa172c98ec32de118b9b5b6ac8b4099a580'),
  [NetworkEnum.ROBINHOOD]: new Address('0x7c2d4aa5c900c08004fadb1c0d953c5b099fec86'),
}
