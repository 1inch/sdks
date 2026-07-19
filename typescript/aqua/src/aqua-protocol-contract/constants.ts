// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { Address, NetworkEnum } from '@1inch/sdk-core'

/**
 * Aqua Protocol contract addresses by chain ID
 */
export const AQUA_CONTRACT_ADDRESSES: Record<NetworkEnum, Address> = {
  [NetworkEnum.ETHEREUM]: new Address('0x1111113ccf1426a8e30e2bff5e005d929bf6a90a'),
  [NetworkEnum.BINANCE]: new Address('0x1111113ccf1426a8e30e2bff5e005d929bf6a90a'),
  [NetworkEnum.POLYGON]: new Address('0x1111113ccf1426a8e30e2bff5e005d929bf6a90a'),
  [NetworkEnum.ARBITRUM]: new Address('0x1111113ccf1426a8e30e2bff5e005d929bf6a90a'),
  [NetworkEnum.AVALANCHE]: new Address('0x1111113ccf1426a8e30e2bff5e005d929bf6a90a'),
  [NetworkEnum.GNOSIS]: new Address('0x1111113ccf1426a8e30e2bff5e005d929bf6a90a'),
  [NetworkEnum.COINBASE]: new Address('0x1111113ccf1426a8e30e2bff5e005d929bf6a90a'),
  [NetworkEnum.OPTIMISM]: new Address('0x1111113ccf1426a8e30e2bff5e005d929bf6a90a'),
  [NetworkEnum.ZKSYNC]: new Address('0x1111113ccf1426a8e30e2bff5e005d929bf6a90a'),
  [NetworkEnum.LINEA]: new Address('0x1111113ccf1426a8e30e2bff5e005d929bf6a90a'),
  [NetworkEnum.UNICHAIN]: new Address('0x1111113ccf1426a8e30e2bff5e005d929bf6a90a'),
  [NetworkEnum.SONIC]: new Address('0x1111113ccf1426a8e30e2bff5e005d929bf6a90a'),
  [NetworkEnum.ROBINHOOD]: new Address('0x1111113ccf1426a8e30e2bff5e005d929bf6a90a'),
}
