import { formatUnits, parseUnits } from 'viem'
import assert from 'assert'

/**
 * Percentage points (100% = 100).
 *
 * {@link scale} is the viem `parseUnits` / `formatUnits` scaler: 1% = 10^7 raw units.
 * That raw {@link value} is the SwapVM fee amount (1e9 = 100%), and 1% = 100 bps.
 */
export class Percent {
  static readonly scale = 7

  readonly value: bigint

  constructor(value: number | string) {
    assert(
      typeof value === 'string' || Number.isFinite(value),
      `Invalid percent: ${value}. Must be a finite number`,
    )

    this.value = parseUnits(
      typeof value === 'number' ? value.toFixed(Percent.scale) : value,
      Percent.scale,
    )

    assert(this.value >= 0n, `Invalid percent: ${value}. Must be non-negative`)
  }

  toString(): string {
    return formatUnits(this.value, Percent.scale)
  }

  toJSON(): string {
    return this.toString()
  }
}
