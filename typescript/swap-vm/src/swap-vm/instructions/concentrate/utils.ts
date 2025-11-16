// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

const TEN_POW_18 = 10n ** 18n

export function computeDeltas(
  balanceA: bigint,
  balanceB: bigint,
  price: bigint,
  priceMin: bigint,
  priceMax: bigint,
): { deltaA: bigint; deltaB: bigint } {
  const sqrtMin = sqrt((price * TEN_POW_18) / priceMin)
  const sqrtMax = sqrt((priceMax * TEN_POW_18) / price)

  return {
    deltaA: price == priceMin ? 0n : (balanceA * TEN_POW_18) / (sqrtMin - TEN_POW_18),
    deltaB: price == priceMax ? 0n : (balanceB * TEN_POW_18) / (sqrtMax - TEN_POW_18),
  }
}

// https://blog.rasc.ch/2018/09/javascript-bigint.html
function sqrt(value: bigint): bigint {
  if (value < 0n) {
    throw 'square root of negative numbers is not supported'
  }

  if (value < 2n) {
    return value
  }

  function newtonIteration(n: bigint, x0: bigint): bigint {
    const x1 = (n / x0 + x0) >> 1n

    if (x0 === x1 || x0 === x1 - 1n) {
      return x0
    }

    return newtonIteration(n, x1)
  }

  return newtonIteration(value, 1n)
}
