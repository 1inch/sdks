// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { Address, NetworkEnum } from '@1inch/sdk-core'

/**
 * AquaSwapVMRouter contract addresses by chain ID
 * These addresses supports only AQUA instructions set
 *
 * Deployed with next params
 * - name    = `AquaSwapVMRouter`
 * - version = `1.0.1`
 *
 * v1.0.1 is opcode-compatible with v1.0.0 (identical instruction ordering for
 * indices 0..32) and additionally registers the `onlyTxOriginTokenBalanceNonZero`
 * (tx.origin access-token / KYC gate) opcode.
 *
 * @see https://github.com/1inch/swap-vm/blob/19cbd44/src/routers/AquaSwapVMRouter.sol#L11
 * @see "../swap-vm/programs/aqua-program-builder"
 */
export const AQUA_SWAP_VM_CONTRACT_ADDRESSES: Record<NetworkEnum, Address> = {
  [NetworkEnum.ETHEREUM]: new Address('0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de'),
  [NetworkEnum.BINANCE]: new Address('0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de'),
  [NetworkEnum.POLYGON]: new Address('0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de'),
  [NetworkEnum.ARBITRUM]: new Address('0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de'),
  [NetworkEnum.AVALANCHE]: new Address('0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de'),
  [NetworkEnum.GNOSIS]: new Address('0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de'),
  [NetworkEnum.COINBASE]: new Address('0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de'),
  [NetworkEnum.OPTIMISM]: new Address('0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de'),
  [NetworkEnum.ZKSYNC]: new Address('0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de'),
  [NetworkEnum.LINEA]: new Address('0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de'),
  [NetworkEnum.UNICHAIN]: new Address('0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de'),
  [NetworkEnum.SONIC]: new Address('0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de'),
  [NetworkEnum.ROBINHOOD]: new Address('0x1111113db0e0ef9d0e3a50d5f094a3a57a26c0de'),
}
