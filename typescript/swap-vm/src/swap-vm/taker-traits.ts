// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { add0x, BN, BytesBuilder, BytesIter, trim0x } from '@1inch/byte-utils'
import type { DataFor } from '@1inch/sdk-core'
import { Address, HexString } from '@1inch/sdk-core'

/**
 * TakerTraits encodes taker-specific parameters and flags for swap execution.
 * It defines how the taker wants the swap to be executed, including thresholds,
 * callbacks, hooks, and other execution parameters.
 */
export class TakerTraits {
  private static readonly IS_EXACT_IN_BIT_FLAG = 0n

  private static readonly SHOULD_UNWRAP_BIT_FLAG = 1n

  private static readonly HAS_PRE_TRANSFER_IN_CALLBACK_BIT_FLAG = 2n

  private static readonly HAS_PRE_TRANSFER_OUT_CALLBACK_BIT_FLAG = 3n

  private static readonly IS_STRICT_THRESHOLD_BIT_FLAG = 4n

  private static readonly IS_FIRST_TRANSFER_FROM_TAKER_BIT_FLAG = 5n

  private static readonly USE_TRANSFER_FROM_AND_AQUA_PUSH_FLAG = 6n

  // eslint-disable-next-line max-params
  constructor(
    /**
     * If true, the taker specifies the exact input amount.
     * If false, the taker specifies the exact output amount.
     */
    public readonly exactIn: boolean,
    /**
     * If true, WETH proceeds are unwrapped into native currency when
     * the order is settled.
     */
    public readonly shouldUnwrap: boolean,
    /**
     * If true, enables pre-transfer-in callback to the taker contract.
     * The callback flag is automatically set based on preTransferInCallbackData presence.
     */
    public readonly preTransferInCallbackEnabled: boolean,
    /**
     * If true, enables pre-transfer-out callback to the taker contract.
     * The callback flag is automatically set based on preTransferOutCallbackData presence.
     */
    public readonly preTransferOutCallbackEnabled: boolean,
    /**
     * If true, requires the exact threshold amount (no slippage tolerance).
     * If false, allows better rates than threshold.
     */
    public readonly strictThreshold: boolean,
    /**
     * If true, the first transfer is from the taker.
     * If false, it may be from another source (e.g., via Aqua).
     */
    public readonly firstTransferFromTaker: boolean,
    /**
     * If true, uses transferFrom and Aqua push mechanism.
     * If false, uses standard transfer mechanism.
     */
    public readonly useTransferFromAndAquaPush: boolean,
    /**
     * Minimum output amount (for exactIn) or maximum input amount (for exactOut).
     * Set to 0n for no threshold.
     */
    public readonly threshold: bigint = 0n,
    /**
     * Custom receiver address for the swap output.
     * Defaults to zero address (meaning taker receives funds).
     */
    public readonly customReceiver: Address = Address.ZERO_ADDRESS,
    /**
     * Optional data passed to the maker's pre-transfer-in hook.
     */
    public readonly preTransferInHookData: HexString = HexString.EMPTY,
    /**
     * Optional data passed to the maker's post-transfer-in hook.
     */
    public readonly postTransferInHookData: HexString = HexString.EMPTY,
    /**
     * Optional data passed to the maker's pre-transfer-out hook.
     */
    public readonly preTransferOutHookData: HexString = HexString.EMPTY,
    /**
     * Optional data passed to the maker's post-transfer-out hook.
     */
    public readonly postTransferOutHookData: HexString = HexString.EMPTY,
    /**
     * Optional callback data for taker's pre-transfer-in callback.
     */
    public readonly preTransferInCallbackData: HexString = HexString.EMPTY,
    /**
     * Optional callback data for taker's pre-transfer-out callback.
     */
    public readonly preTransferOutCallbackData: HexString = HexString.EMPTY,
    /**
     * Optional arguments for VM instructions execution.
     */
    public readonly instructionsArgs: HexString = HexString.EMPTY,
    /**
     * ECDSA signature for order validation (65 bytes typically).
     * Can be empty when using Aqua authentication.
     */
    public readonly signature: HexString = HexString.EMPTY,
  ) {}

  /**
   * Creates a new TakerTraits instance with the specified data.
   * Provides default values for unspecified fields.
   */
  static new(data: Partial<DataFor<TakerTraits>> = {}): TakerTraits {
    return new TakerTraits(
      data.exactIn ?? true,
      data.shouldUnwrap ?? false,
      data.preTransferInCallbackEnabled ?? false,
      data.preTransferOutCallbackEnabled ?? false,
      data.strictThreshold ?? false,
      data.firstTransferFromTaker ?? false,
      data.useTransferFromAndAquaPush ?? true,
      data.threshold,
      data.customReceiver,
      data.preTransferInHookData,
      data.postTransferInHookData,
      data.preTransferOutHookData,
      data.postTransferOutHookData,
      data.preTransferInCallbackData,
      data.preTransferOutCallbackData,
      data.instructionsArgs,
      data.signature,
    )
  }

  /**
   * Creates a default TakerTraits instance with standard settings.
   * - exactIn mode
   * - No unwrapping
   * - No callbacks
   * - No custom receiver
   * - transferFromAndAquaPush enabled
   */
  static default(): TakerTraits {
    return TakerTraits.new({
      exactIn: true,
      shouldUnwrap: false,
      preTransferInCallbackEnabled: false,
      preTransferOutCallbackEnabled: false,
      strictThreshold: false,
      firstTransferFromTaker: false,
      useTransferFromAndAquaPush: true,
      threshold: 0n,
      customReceiver: Address.ZERO_ADDRESS,
      preTransferInHookData: HexString.EMPTY,
      postTransferInHookData: HexString.EMPTY,
      preTransferOutHookData: HexString.EMPTY,
      postTransferOutHookData: HexString.EMPTY,
      preTransferInCallbackData: HexString.EMPTY,
      preTransferOutCallbackData: HexString.EMPTY,
      instructionsArgs: HexString.EMPTY,
      signature: HexString.EMPTY,
    })
  }

  /**
   * Decodes a packed TakerTraits from a hex string.
   * The packed format consists of:
   * - 18 bytes: 9 uint16 offsets for data sections
   * - 2 bytes: uint16 flags
   * - Variable: data sections (threshold, to, hook data, callback data, etc.)
   * - Variable: signature
   */
  static decode(packed: HexString): TakerTraits {
    const iter = BytesIter.BigInt(packed.toString())

    const offsets = Array.from({ length: 9 }, () => Number(iter.nextUint16()))
    const flags = new BN(iter.nextUint16())

    const dataStr = trim0x(packed.toString()).slice(40)
    const sections: string[] = []

    offsets.forEach((offset, i) => {
      const start = i === 0 ? 0 : offsets[i - 1]
      sections.push(offset > start ? dataStr.slice(start * 2, offset * 2) : '')
    })

    const lastOffset = offsets[offsets.length - 1]
    const signature = dataStr.length > lastOffset * 2 ? dataStr.slice(lastOffset * 2) : ''

    const [
      threshold,
      to,
      preTransferInHookData,
      postTransferInHookData,
      preTransferOutHookData,
      postTransferOutHookData,
      preTransferInCallbackData,
      preTransferOutCallbackData,
      instructionsArgs,
    ] = sections

    return TakerTraits.new({
      exactIn: Boolean(flags.getBit(TakerTraits.IS_EXACT_IN_BIT_FLAG)),
      shouldUnwrap: Boolean(flags.getBit(TakerTraits.SHOULD_UNWRAP_BIT_FLAG)),
      preTransferInCallbackEnabled: Boolean(
        flags.getBit(TakerTraits.HAS_PRE_TRANSFER_IN_CALLBACK_BIT_FLAG),
      ),
      preTransferOutCallbackEnabled: Boolean(
        flags.getBit(TakerTraits.HAS_PRE_TRANSFER_OUT_CALLBACK_BIT_FLAG),
      ),
      strictThreshold: Boolean(flags.getBit(TakerTraits.IS_STRICT_THRESHOLD_BIT_FLAG)),
      firstTransferFromTaker: Boolean(
        flags.getBit(TakerTraits.IS_FIRST_TRANSFER_FROM_TAKER_BIT_FLAG),
      ),
      useTransferFromAndAquaPush: Boolean(
        flags.getBit(TakerTraits.USE_TRANSFER_FROM_AND_AQUA_PUSH_FLAG),
      ),
      threshold: threshold ? BigInt(add0x(threshold)) : 0n,
      customReceiver: to ? new Address(add0x(to)) : Address.ZERO_ADDRESS,
      preTransferInHookData: preTransferInHookData
        ? new HexString(add0x(preTransferInHookData))
        : HexString.EMPTY,
      postTransferInHookData: postTransferInHookData
        ? new HexString(add0x(postTransferInHookData))
        : HexString.EMPTY,
      preTransferOutHookData: preTransferOutHookData
        ? new HexString(add0x(preTransferOutHookData))
        : HexString.EMPTY,
      postTransferOutHookData: postTransferOutHookData
        ? new HexString(add0x(postTransferOutHookData))
        : HexString.EMPTY,
      preTransferInCallbackData: preTransferInCallbackData
        ? new HexString(add0x(preTransferInCallbackData))
        : HexString.EMPTY,
      preTransferOutCallbackData: preTransferOutCallbackData
        ? new HexString(add0x(preTransferOutCallbackData))
        : HexString.EMPTY,
      instructionsArgs: instructionsArgs ? new HexString(add0x(instructionsArgs)) : HexString.EMPTY,
      signature: signature ? new HexString(add0x(signature)) : HexString.EMPTY,
    })
  }

  /**
   * Creates a new instance with updated fields.
   * Useful for creating modified versions of existing TakerTraits.
   */
  public with(data: Partial<DataFor<TakerTraits>>): this {
    Object.assign(this, data)

    return this
  }

  /**
   * Encodes the TakerTraits into a packed hex string format.
   * The encoding includes offsets, flags, data sections, and signature.
   * Callback flags are automatically set based on callback data presence.
   */
  encode(): HexString {
    const builder = new BytesBuilder()

    const dataFields = [
      this.threshold > 0n
        ? new HexString('0x' + this.threshold.toString(16).padStart(64, '0'))
        : HexString.EMPTY,
      !this.customReceiver.isZero()
        ? new HexString(this.customReceiver.toString())
        : HexString.EMPTY,
      this.preTransferInHookData,
      this.postTransferInHookData,
      this.preTransferOutHookData,
      this.postTransferOutHookData,
      this.preTransferInCallbackData,
      this.preTransferOutCallbackData,
      this.instructionsArgs,
    ]

    const { offsets, data } = dataFields.reduce(
      (acc, field) => {
        const length = field.bytesCount()
        acc.sum += length
        acc.offsets.push(acc.sum)
        acc.data.push(field.toString().slice(2))

        return acc
      },
      { sum: 0, offsets: [] as number[], data: [] as string[] },
    )

    offsets.reverse().forEach((offset) => builder.addUint16(BigInt(offset)))

    let flags = new BN(0n)
    flags = flags.setBit(TakerTraits.IS_EXACT_IN_BIT_FLAG, this.exactIn)
    flags = flags.setBit(TakerTraits.SHOULD_UNWRAP_BIT_FLAG, this.shouldUnwrap)
    flags = flags.setBit(
      TakerTraits.HAS_PRE_TRANSFER_IN_CALLBACK_BIT_FLAG,
      !this.preTransferInCallbackData.isEmpty(),
    )
    flags = flags.setBit(
      TakerTraits.HAS_PRE_TRANSFER_OUT_CALLBACK_BIT_FLAG,
      !this.preTransferOutCallbackData.isEmpty(),
    )
    flags = flags.setBit(TakerTraits.IS_STRICT_THRESHOLD_BIT_FLAG, this.strictThreshold)
    flags = flags.setBit(
      TakerTraits.IS_FIRST_TRANSFER_FROM_TAKER_BIT_FLAG,
      this.firstTransferFromTaker,
    )
    flags = flags.setBit(
      TakerTraits.USE_TRANSFER_FROM_AND_AQUA_PUSH_FLAG,
      this.useTransferFromAndAquaPush,
    )

    builder.addUint16(flags.value)

    const allData = data.join('') + this.signature.toString().slice(2)

    if (allData) {
      builder.addBytes('0x' + allData)
    }

    return new HexString(builder.asHex())
  }

  /**
   * Validates the swap amounts against the threshold settings.
   * @param amountIn - The input amount of the swap
   * @param amountOut - The output amount of the swap
   * @throws Error if the amounts don't meet the threshold requirements
   */
  validate(amountIn: bigint, amountOut: bigint): void {
    if (this.threshold === 0n) return

    const threshold = this.threshold

    if (this.strictThreshold) {
      const actual = this.exactIn ? amountOut : amountIn

      if (actual !== threshold) {
        throw new Error(
          `TakerTraitsNonExactThresholdAmount: ${this.exactIn ? 'amountOut' : 'amountIn'} ${actual} != threshold ${threshold}`,
        )
      }
    } else {
      if (this.exactIn) {
        if (amountOut < threshold) {
          throw new Error(
            `TakerTraitsInsufficientMinOutputAmount: amountOut ${amountOut} < threshold ${threshold}`,
          )
        }
      } else {
        if (amountIn > threshold) {
          throw new Error(
            `TakerTraitsExceedingMaxInputAmount: amountIn ${amountIn} > threshold ${threshold}`,
          )
        }
      }
    }
  }
}
