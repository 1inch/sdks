// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { Address, NetworkEnum } from '@1inch/sdk-core'

/**
 * AquaSwapVMRouter contract addresses by chain ID
 * These addresses supports only AQUA instructions set
 *
 * Deployed with next EIP-712 domain params (per on-chain `eip712Domain()`)
 * - name    = `1inch SwapVM v1.0`
 * - version = `1.0.2` (the Monad, Cronos, HyperEVM and Arc deployments report `1.0`)
 *
 * Supersedes the previous AquaSwapVMRouter deployment at
 * `0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de` (all chains).
 *
 * @see https://github.com/1inch/swap-vm/blob/fcca73f/src/routers/AquaSwapVMRouter.sol#L16
 * @see "../swap-vm/programs/aqua-program-builder"
 */
export const AQUA_SWAP_VM_CONTRACT_ADDRESSES: Record<NetworkEnum, Address> = {
  [NetworkEnum.ETHEREUM]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.BINANCE]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.POLYGON]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.ARBITRUM]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.AVALANCHE]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.GNOSIS]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.COINBASE]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.OPTIMISM]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.ZKSYNC]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.LINEA]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.UNICHAIN]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.SONIC]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.ROBINHOOD]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.MONAD]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.CRONOS]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.HYPEREVM]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
  [NetworkEnum.ARC]: new Address('0x111111338c5091e8440b67b168bae16a668ac0de'),
}
