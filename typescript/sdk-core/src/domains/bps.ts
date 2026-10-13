import { formatUnits, parseUnits } from 'viem'
import assert from 'assert'

/**
 * Basis points (10_000 bps = 100%).
 *
 * {@link scale} is the viem `parseUnits` / `formatUnits` scaler: 1 bps = 10^5 raw units.
 * That raw {@link value} is the SwapVM fee amount (1e9 = 100%).
 */
export class Bps {
  static readonly scale = 5

  readonly value: bigint

  constructor(value: number | string) {
    assert(
      typeof value === 'string' || Number.isFinite(value),
      `Invalid bps: ${value}. Must be a finite number`,
    )

    this.value = parseUnits(typeof value === 'number' ? value.toFixed(Bps.scale) : value, Bps.scale)

    assert(this.value >= 0n, `Invalid bps: ${value}. Must be non-negative`)
  }

  toString(): string {
    return formatUnits(this.value, Bps.scale)
  }

  toJSON(): string {
    return this.toString()
  }
}
