import { formatUnits } from 'viem'
import assert from 'assert'
import { parseScaled } from './parse-scaled'

/**
 * Basis points (10_000 bps = 100%).
 *
 * {@link scale} is the viem `parseUnits` / `formatUnits` scaler: 1 bps = 10^5 raw units.
 * {@link toScaledBigInt} is the SwapVM fee amount (1e9 = 100%).
 */
export class Bps {
  static readonly scale = 5

  private constructor(private readonly value: bigint) {
    assert(value >= 0n, `Invalid bps: ${value}. Must be non-negative`)
  }

  static fromNumber(value: number): Bps {
    return new Bps(parseScaled(value, Bps.scale, 'bps'))
  }

  static fromString(value: string): Bps {
    return new Bps(parseScaled(value, Bps.scale, 'bps'))
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
