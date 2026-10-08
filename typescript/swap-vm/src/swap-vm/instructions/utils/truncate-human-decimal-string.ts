// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

/**
 * Round a decimal string to `maxFrac` fractional digits, then strip trailing zeros after the dot.
 *
 * Rounding is half away from zero: the magnitude is rounded half-up (if the first dropped digit
 * is `5`–`9`, round the last kept digit up) and the sign is kept, so `-0.25` with `maxFrac = 1`
 * gives `-0.3`. A negative value that rounds to zero gives `0`, never `-0`.
 *
 * @param s Decimal string as produced by e.g. `formatUnits` (no scientific notation), optionally
 * prefixed with `-`.
 * @param maxFrac Maximum number of digits after `.`; `0` means integer only (round using the
 * first fractional digit).
 */
export function truncateHumanDecimalString(s: string, maxFrac: number): string {
  if (maxFrac < 0) {
    throw new Error('maxFrac must be non-negative')
  }

  const negative = s.startsWith('-')
  const magnitude = roundMagnitudeHalfUp(negative ? s.slice(1) : s, maxFrac)

  return negative && !/^0+$/.test(magnitude) ? `-${magnitude}` : magnitude
}

function roundMagnitudeHalfUp(s: string, maxFrac: number): string {
  const dot = s.indexOf('.')

  if (dot === -1) {
    return s
  }

  const intPartStr = s.slice(0, dot) || '0'
  const fracFull = s.slice(dot + 1)

  if (maxFrac === 0) {
    let intPart = BigInt(intPartStr)
    const first = fracFull[0]

    if (first !== undefined && first >= '5' && first <= '9') {
      intPart += 1n
    }

    return intPart.toString()
  }

  const fracPadded = (fracFull + '0'.repeat(maxFrac)).slice(0, maxFrac)
  const nextDigit = fracFull.length > maxFrac ? fracFull[maxFrac] : undefined
  const roundUp = nextDigit !== undefined && nextDigit >= '5' && nextDigit <= '9'

  const scale = 10n ** BigInt(maxFrac)
  let scaled = BigInt(intPartStr) * scale + BigInt(fracPadded || '0')

  if (roundUp) {
    scaled += 1n
  }

  const intOut = scaled / scale
  let fracOut = (scaled % scale).toString().padStart(maxFrac, '0')
  fracOut = fracOut.replace(/0+$/, '')

  return fracOut.length > 0 ? `${intOut}.${fracOut}` : intOut.toString()
}
