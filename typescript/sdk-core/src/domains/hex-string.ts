import assert from 'node:assert'
import { assertHexString } from '../validators/should-be-hex-string'
import type { Hex } from '../types'

export class HexString {
  static EMPTY: HexString = new HexString('0x')

  private readonly hexString: Hex

  constructor(hex: string, name = '') {
    assertHexString(hex, `hexString ${name}`)
    assert(hex.length % 2 === 0, 'Hex string must have an even length')

    this.hexString = hex
  }

  static fromBigInt(bigInt: bigint, name?: string): HexString {
    return new HexString(`0x${bigInt.toString(16)}`, name)
  }

  static fromUnknown(val: unknown, name?: string): HexString {
    if (typeof val === 'bigint') {
      return HexString.fromBigInt(val, name)
    }

    if (typeof val === 'string') {
      return new HexString(val, name)
    }

    throw new Error(`Invalid hex string${name ? ' ' + name : ''}`)
  }

  toBigInt(): bigint {
    return BigInt(this.hexString)
  }

  isEmpty(): boolean {
    return this.hexString === '0x'
  }

  concat(other: HexString): HexString {
    return new HexString(this.hexString + other.hexString.slice(2))
  }

  bytesCount(): number {
    return (this.hexString.length - 2) / 2
  }

  sliceBytes(start: number, end?: number): HexString {
    return new HexString('0x' + this.hexString.slice(start * 2 + 2, end ? end * 2 + 2 : undefined))
  }

  equal(other: HexString): boolean {
    return this.hexString === other.hexString
  }

  toString(): Hex {
    return this.hexString
  }

  toJSON(): string {
    return this.hexString
  }
}
