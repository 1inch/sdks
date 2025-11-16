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
