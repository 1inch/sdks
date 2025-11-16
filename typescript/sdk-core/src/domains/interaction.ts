import { BytesIter, isHexBytes } from '@1inch/byte-utils'
import assert from 'assert'
import { Address } from './address'
import { HexString } from './hex-string'

export class Interaction {
  constructor(
    public readonly target: Address,
    public readonly data: HexString,
  ) {
    assert(isHexBytes(data.toString()), 'Interaction data must be valid hex bytes')
  }

  /**
   * Create `Interaction` from bytes
   *
   * @param First 20 bytes are target, then data
   */
  public static decode(bytes: HexString): Interaction {
    const iter = BytesIter.HexString(bytes.toString())

    return new Interaction(new Address(iter.nextUint160()), new HexString(iter.rest()))
  }

  /**
   * First 20 bytes are target, then data
   */
  public encode(): HexString {
    return new HexString(this.target.toString() + this.data.toString().slice(2))
  }

  public equal(other: Interaction): boolean {
    return this.target.equal(other.target) && this.data.equal(other.data)
  }
}
