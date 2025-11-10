import { add0x } from '@1inch/byte-utils'
import { Address } from './address'
import { assertHexString } from '../validators'

/**
 * Represents the last 10 bytes (80 bits) of an Ethereum address
 */
export class AddressHalf {
  private readonly value: string

  private constructor(hexValue: string) {
    this.value = hexValue.toLowerCase()
  }

  static fromAddress(address: Address): AddressHalf {
    return new AddressHalf(address.lastHalf())
  }

  static fromString(hexValue: string): AddressHalf {
    return new AddressHalf(new Address(add0x(hexValue.padStart(40, '0'))).lastHalf())
  }

  static fromHex(hexValue: string): AddressHalf {
    assertHexString(hexValue)

    return new AddressHalf(add0x(hexValue.padStart(20, '0')))
  }

  toString(): string {
    return this.value
  }

  equals(other: AddressHalf): boolean {
    return this.value === other.value
  }
}
