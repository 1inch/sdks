import { isAddress } from 'viem'
import { add0x } from '@1inch/byte-utils'
import assert from 'node:assert'
import type { Hex } from '../types'

/**
 * Address domain class
 */
export class Address {
  static NATIVE_CURRENCY: Address = new Address('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')

  static ZERO_ADDRESS: Address = new Address('0x0000000000000000000000000000000000000000')

  private readonly val: Hex

  constructor(val: string) {
    assert(isAddress(val), `Invalid address ${val}`)

    this.val = val.toLowerCase() as Hex
  }

  static fromBigInt(val: bigint): Address {
    return new Address(add0x(val.toString(16).padStart(40, '0')))
  }

  static fromFirstBytes(bytes: string): Address {
    return new Address(bytes.slice(0, 42))
  }

  public toString(): Hex {
    return this.val
  }

  public equal(other: Address): boolean {
    return this.val === other.val
  }

  public isNative(): boolean {
    return this.equal(Address.NATIVE_CURRENCY)
  }

  public isZero(): boolean {
    return this.equal(Address.ZERO_ADDRESS)
  }

  public lastHalf(): string {
    return add0x(this.val.slice(-20))
  }

  toJSON(): string {
    return this.val
  }
}
