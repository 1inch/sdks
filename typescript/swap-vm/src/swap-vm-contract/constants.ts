// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { Address, NetworkEnum } from '@1inch/sdk-core'
import assert from 'assert'
import type { Eip712Domain } from '../swap-vm/order'

/**
 * AquaSwapVMRouter contract addresses by chain ID
 * These addresses supports only AQUA instructions set
 *
 * EIP-712 domain of each deployment: see {@link AQUA_SWAP_VM_EIP712_DOMAINS}
 * and {@link getAquaSwapVmEip712Domain}
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

/**
 * EIP-712 domain `name` and `version` of the AquaSwapVMRouter deployments
 * from {@link AQUA_SWAP_VM_CONTRACT_ADDRESSES}, as returned by their on-chain `eip712Domain()`.
 *
 * The `version` is not the same on every chain: the Monad, Cronos, HyperEVM and Arc
 * deployments use `1.0`, all others use `1.0.2`.
 *
 * @see getAquaSwapVmEip712Domain for the complete domain expected by `Order.hash()`
 */
export const AQUA_SWAP_VM_EIP712_DOMAINS: Record<
  NetworkEnum,
  Pick<Eip712Domain, 'name' | 'version'>
> = {
  [NetworkEnum.ETHEREUM]: { name: '1inch SwapVM v1.0', version: '1.0.2' },
  [NetworkEnum.BINANCE]: { name: '1inch SwapVM v1.0', version: '1.0.2' },
  [NetworkEnum.POLYGON]: { name: '1inch SwapVM v1.0', version: '1.0.2' },
  [NetworkEnum.ARBITRUM]: { name: '1inch SwapVM v1.0', version: '1.0.2' },
  [NetworkEnum.AVALANCHE]: { name: '1inch SwapVM v1.0', version: '1.0.2' },
  [NetworkEnum.GNOSIS]: { name: '1inch SwapVM v1.0', version: '1.0.2' },
  [NetworkEnum.COINBASE]: { name: '1inch SwapVM v1.0', version: '1.0.2' },
  [NetworkEnum.OPTIMISM]: { name: '1inch SwapVM v1.0', version: '1.0.2' },
  [NetworkEnum.ZKSYNC]: { name: '1inch SwapVM v1.0', version: '1.0.2' },
  [NetworkEnum.LINEA]: { name: '1inch SwapVM v1.0', version: '1.0.2' },
  [NetworkEnum.UNICHAIN]: { name: '1inch SwapVM v1.0', version: '1.0.2' },
  [NetworkEnum.SONIC]: { name: '1inch SwapVM v1.0', version: '1.0.2' },
  [NetworkEnum.ROBINHOOD]: { name: '1inch SwapVM v1.0', version: '1.0.2' },
  [NetworkEnum.MONAD]: { name: '1inch SwapVM v1.0', version: '1.0' },
  [NetworkEnum.CRONOS]: { name: '1inch SwapVM v1.0', version: '1.0' },
  [NetworkEnum.HYPEREVM]: { name: '1inch SwapVM v1.0', version: '1.0' },
  [NetworkEnum.ARC]: { name: '1inch SwapVM v1.0', version: '1.0' },
}

/**
 * Returns the EIP-712 domain of the AquaSwapVMRouter deployed on `chainId`,
 * in the shape expected by `Order.hash()` for signature-based orders
 * (`useAquaInsteadOfSignature = false`).
 *
 * @throws if no AquaSwapVMRouter is deployed on `chainId`
 */
export function getAquaSwapVmEip712Domain(chainId: NetworkEnum): Eip712Domain {
  const domain = AQUA_SWAP_VM_EIP712_DOMAINS[chainId]
  assert(domain, `AquaSwapVMRouter is not deployed on chain ${chainId}`)

  return {
    chainId,
    name: domain.name,
    version: domain.version,
    verifyingContract: AQUA_SWAP_VM_CONTRACT_ADDRESSES[chainId],
  }
}
