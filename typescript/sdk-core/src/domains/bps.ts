import { formatUnits, parseUnits } from 'viem'
import assert from 'assert'

/**
 * Basis points (10_000 bps = 100%).
 *
 * {@link scale} is the viem `parseUnits` / `formatUnits` scaler: 1 bps = 10^5 raw units.
 * {@link toScaledBigInt} is the SwapVM fee amount (1e9 = 100%).
 */
export class Bps {
  static readonly scale = 5

  constructor(private readonly value: bigint) {
    assert(value >= 0n, `Invalid bps: ${value}. Must be non-negative`)
  }

  static fromNumber(value: number): Bps {
    assert(Number.isFinite(value), `Invalid bps: ${value}. Must be a finite number`)

    return new Bps(parseUnits(value.toFixed(Bps.scale), Bps.scale))
  }

  static fromString(value: string): Bps {
    return new Bps(parseUnits(value, Bps.scale))
  }

  toScaledBigInt(): bigint {
    return this.value
  }

  toString(): string {
    return formatUnits(this.value, Bps.scale)
  }

  toNumber(): number {
    return Number(this.toString())
  }

  toJSON(): string {
    return this.toString()
  }
}
