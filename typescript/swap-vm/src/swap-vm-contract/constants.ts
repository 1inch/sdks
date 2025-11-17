// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { Address, NetworkEnum } from '@1inch/sdk-core'

/**
 * AquaSwapVMRouter contract addresses by chain ID
 * These addresses supports only AQUA instructions set
 *
 * Deployed with next params
 * - name    = `AquaSwapVMRouter`
 * - version = `1.0.0`
 *
 * @see https://github.com/1inch/swap-vm/blob/8cc4c467374959af9efdb6e2b67d32d3c1083e1e/src/routers/AquaSwapVMRouter.sol#L11
 * @see "../swap-vm/programs/aqua-program-builder"
 */
export const AQUA_SWAP_VM_CONTRACT_ADDRESSES: Record<NetworkEnum, Address> = {
  [NetworkEnum.ETHEREUM]: new Address('0x8fdd04dbf6111437b44bbca99c28882434e0958f'),
  [NetworkEnum.BINANCE]: new Address('0x8fdd04dbf6111437b44bbca99c28882434e0958f'),
  [NetworkEnum.POLYGON]: new Address('0x8fdd04dbf6111437b44bbca99c28882434e0958f'),
  [NetworkEnum.ARBITRUM]: new Address('0x8fdd04dbf6111437b44bbca99c28882434e0958f'),
  [NetworkEnum.AVALANCHE]: new Address('0x8fdd04dbf6111437b44bbca99c28882434e0958f'),
  [NetworkEnum.GNOSIS]: new Address('0x8fdd04dbf6111437b44bbca99c28882434e0958f'),
  [NetworkEnum.COINBASE]: new Address('0x8fdd04dbf6111437b44bbca99c28882434e0958f'),
  [NetworkEnum.OPTIMISM]: new Address('0x8fdd04dbf6111437b44bbca99c28882434e0958f'),
  [NetworkEnum.ZKSYNC]: new Address('0x8fdd04dbf6111437b44bbca99c28882434e0958f'),
  [NetworkEnum.LINEA]: new Address('0x8fdd04dbf6111437b44bbca99c28882434e0958f'),
  [NetworkEnum.UNICHAIN]: new Address('0x8fdd04dbf6111437b44bbca99c28882434e0958f'),
  [NetworkEnum.SONIC]: new Address('0x8fdd04dbf6111437b44bbca99c28882434e0958f'),
}
