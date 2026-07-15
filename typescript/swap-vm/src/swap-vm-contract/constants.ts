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
  [NetworkEnum.ETHEREUM]: new Address('0x3c4758979ec30ca45857cabc2462a70699ed790e'),
  [NetworkEnum.BINANCE]: new Address('0x3c4758979ec30ca45857cabc2462a70699ed790e'),
  [NetworkEnum.POLYGON]: new Address('0x3c4758979ec30ca45857cabc2462a70699ed790e'),
  [NetworkEnum.ARBITRUM]: new Address('0x3c4758979ec30ca45857cabc2462a70699ed790e'),
  [NetworkEnum.AVALANCHE]: new Address('0x3c4758979ec30ca45857cabc2462a70699ed790e'),
  [NetworkEnum.GNOSIS]: new Address('0x3c4758979ec30ca45857cabc2462a70699ed790e'),
  [NetworkEnum.COINBASE]: new Address('0x3c4758979ec30ca45857cabc2462a70699ed790e'),
  [NetworkEnum.OPTIMISM]: new Address('0x3c4758979ec30ca45857cabc2462a70699ed790e'),
  [NetworkEnum.ZKSYNC]: new Address('0x3c4758979ec30ca45857cabc2462a70699ed790e'),
  [NetworkEnum.LINEA]: new Address('0x3c4758979ec30ca45857cabc2462a70699ed790e'),
  [NetworkEnum.UNICHAIN]: new Address('0x3c4758979ec30ca45857cabc2462a70699ed790e'),
  [NetworkEnum.SONIC]: new Address('0x3c4758979ec30ca45857cabc2462a70699ed790e'),
  [NetworkEnum.ROBINHOOD]: new Address('0x3c4758979ec30ca45857cabc2462a70699ed790e'),
}
