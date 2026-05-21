// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

export function resolveRate(tokenADecimals: bigint, tokenBDecimals: bigint): bigint {
  if (tokenADecimals === tokenBDecimals) {
    return 1n
  }

  if (tokenADecimals > tokenBDecimals) {
    return 1n
  }

  return 10n ** (tokenBDecimals - tokenADecimals)
}
