import { formatUnits, parseUnits } from 'viem'
import assert from 'assert'

/**
 * Percentage points (100% = 100).
 *
 * {@link scale} is the viem `parseUnits` / `formatUnits` scaler: 1% = 10^7 raw units.
 * {@link toScaledBigInt} is the SwapVM fee amount (1e9 = 100%), and 1% = 100 bps.
 */
export class Percent {
  static readonly scale = 7

  constructor(private readonly value: bigint) {
    assert(value >= 0n, `Invalid percent: ${value}. Must be non-negative`)
  }

  static fromNumber(value: number): Percent {
    assert(Number.isFinite(value), `Invalid percent: ${value}. Must be a finite number`)

    return new Percent(parseUnits(value.toFixed(Percent.scale), Percent.scale))
  }

  static fromString(value: string): Percent {
    return new Percent(parseUnits(value, Percent.scale))
  }

  toScaledBigInt(): bigint {
    return this.value
  }

  toString(): string {
    return formatUnits(this.value, Percent.scale)
  }

  toNumber(): number {
    return Number(this.toString())
  }

  toJSON(): string {
    return this.toString()
  }
}
