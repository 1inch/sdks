// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { DataFor, Hex, NetworkEnum } from '@1inch/sdk-core'
import { Address, HexString } from '@1inch/sdk-core'
import { keccak256, encodeAbiParameters, hashTypedData, decodeAbiParameters } from 'viem'
import assert from 'assert'
import { MakerTraits } from './maker-traits'
import { SwapVmProgram } from './programs'

/**
 * Internal ABI-ready representation of an order.
 *
 * 💡 Gotcha:
 * - `traits` is already the packed `uint256` produced by `MakerTraits.encode`.
 * - `data` is the raw concatenation `hooksData.concat(program)` used for on-chain VM execution.
 *
 * This is the exact shape used for:
 * - `encodeAbiParameters([Order.ABI], [builtOrder])`
 * - EIP-712 message payload in `hash()`.
 */
type BuiltOrder = {
  maker: Hex
  traits: bigint
  data: Hex
}

/**
 * Representation of a SwapVM order.
 */
export class Order {
  static ABI = {
    type: 'tuple',
    components: [
      { name: 'maker', type: 'address' },
      { name: 'traits', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
  } as const

  constructor(
    public readonly maker: Address,
    public readonly traits: MakerTraits,
    public readonly program: SwapVmProgram,
  ) {}

  public static new(params: DataFor<Order>): Order {
    return new Order(params.maker, params.traits, params.program)
  }

  /**
   * Reconstructs an `Order` from its ABI-encoded representation.
   *
   * 🎯 Non-obvious:
   * - Any change to how `MakerTraits` packs `hooksData` must preserve the contract that
   *   `hooksDataEndsAtByte(traits)` points exactly to the start of the program, or decoding will drift.
   */
  public static decode(encoded: HexString): Order {
    const [{ maker, traits, data }] = decodeAbiParameters([Order.ABI], encoded.toString())

    const makerTraits = MakerTraits.decode(traits, new HexString(data))
    const program = new HexString(data).sliceBytes(MakerTraits.hooksDataEndsAtByte(traits))

    return new Order(new Address(maker), makerTraits, new SwapVmProgram(program.toString()))
  }

  /**
   * Computes an order hash used for signing or as a deterministic order identifier.
   *
   * Hashing modes:
   * - Aqua mode (`traits.useAquaInsteadOfSignature === true`):
   *   - Returns `keccak256(encode())`.
   *   - Ignores provided `domain` completely.
   * - EIP-712 signature mode (`useAquaInsteadOfSignature === false`):
   *   - Requires a `domain`; if missing, an assertion error is thrown.
   *
   * ⚠️ IMPORTANT:
   * - Callers must ensure they pass the same `domain` parameters that the verifier
   *   uses on-chain; mismatches will produce hashes that cannot be verified.
   */
  public hash(domain?: {
    chainId: NetworkEnum
    name: string
    verifyingContract: Address
    version: string
  }): HexString {
    if (this.traits.useAquaInsteadOfSignature) {
      return new HexString(keccak256(this.encode().toString()))
    }

    assert(domain, 'domain info required if isUseOfAquaInsteadOfSignatureEnabled is false')

    return new HexString(
      hashTypedData({
        domain: {
          ...domain,
          verifyingContract: domain.verifyingContract.toString(),
        },
        primaryType: 'Order',
        types: {
          Order: [
            { name: 'maker', type: 'address' },
            { name: 'traits', type: 'uint256' },
            { name: 'data', type: 'bytes' },
          ],
        },
        message: this.build(),
      }),
    )
  }

  /**
   * ABI-encodes the order into the exact bytes blob expected by on-chain contracts.
   *
   * Usage:
   * - Input to `keccak256` in Aqua mode (`hash()`).
   * - Payload for contract methods expecting an `Order` tuple.
   */
  public encode(): HexString {
    const encoded = encodeAbiParameters([Order.ABI], [this.build()])

    return new HexString(encoded)
  }

  /**
   * Produces the ABI-ready `BuiltOrder` tuple`.
   */
  public build(): BuiltOrder {
    const { traits, hooksData } = this.traits.encode(this.maker)

    return {
      maker: this.maker.toString(),
      traits,
      data: hooksData.concat(this.program).toString(),
    }
  }
}
