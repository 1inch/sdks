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
  [NetworkEnum.ETHEREUM]: new Address('0xdfd05fe230bfe7b212878414270c72c8345506fa'),
  [NetworkEnum.BINANCE]: new Address('0xdfd05fe230bfe7b212878414270c72c8345506fa'),
  [NetworkEnum.POLYGON]: new Address('0xdfd05fe230bfe7b212878414270c72c8345506fa'),
  [NetworkEnum.ARBITRUM]: new Address('0xdfd05fe230bfe7b212878414270c72c8345506fa'),
  [NetworkEnum.AVALANCHE]: new Address('0xdfd05fe230bfe7b212878414270c72c8345506fa'),
  [NetworkEnum.GNOSIS]: new Address('0xdfd05fe230bfe7b212878414270c72c8345506fa'),
  [NetworkEnum.COINBASE]: new Address('0xdfd05fe230bfe7b212878414270c72c8345506fa'),
  [NetworkEnum.OPTIMISM]: new Address('0xdfd05fe230bfe7b212878414270c72c8345506fa'),
  [NetworkEnum.ZKSYNC]: new Address('0xdfd05fe230bfe7b212878414270c72c8345506fa'),
  [NetworkEnum.LINEA]: new Address('0xdfd05fe230bfe7b212878414270c72c8345506fa'),
  [NetworkEnum.UNICHAIN]: new Address('0xdfd05fe230bfe7b212878414270c72c8345506fa'),
  [NetworkEnum.SONIC]: new Address('0xdfd05fe230bfe7b212878414270c72c8345506fa'),
}
