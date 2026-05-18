// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

export function resolveRate(tokenADecimals: number, tokenBDecimals: number): bigint {
  if (tokenADecimals === tokenBDecimals) {
    return 1n
  }

  if (tokenADecimals > tokenBDecimals) {
    return 1n
  }

  return 10n ** BigInt(tokenBDecimals - tokenADecimals)
}
