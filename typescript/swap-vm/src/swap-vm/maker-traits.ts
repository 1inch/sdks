import { BitMask, BN } from '@1inch/byte-utils'
import { Address } from '@1inch/sdk-core'
import type { MakerTraitsBuildArgs } from './types'

/**
 * The MakerTraits type is a uint256, and different parts of the number are used to encode different traits.
 * High bits are used for flags:
 * 255 bit `SHOULD_UNWRAP_BIT_FLAG`                   - if set, the order should unwrap WETH
 * 254 bit `USE_AQUA_INSTEAD_OF_SIGNATURE_BIT_FLAG`   - if set, use Aqua instead of signature
 * 253 bit `ALLOW_ZERO_AMOUNT_IN`                     - if set, allow zero amount in
 * 252 bit `HAS_PRE_TRANSFER_IN_HOOK_BIT_FLAG`        - if set, has pre-transfer-in hook
 * 251 bit `HAS_POST_TRANSFER_IN_HOOK_BIT_FLAG`       - if set, has post-transfer-in hook
 * 250 bit `HAS_PRE_TRANSFER_OUT_HOOK_BIT_FLAG`       - if set, has pre-transfer-out hook
 * 249 bit `HAS_POST_TRANSFER_OUT_HOOK_BIT_FLAG`      - if set, has post-transfer-out hook
 * 248 bit `PRE_TRANSFER_IN_HOOK_HAS_TARGET`          - if set, pre-transfer-in hook target is in data (not maker)
 * 247 bit `POST_TRANSFER_IN_HOOK_HAS_TARGET`         - if set, post-transfer-in hook target is in data (not maker)
 * 246 bit `PRE_TRANSFER_OUT_HOOK_HAS_TARGET`         - if set, pre-transfer-out hook target is in data (not maker)
 * 245 bit `POST_TRANSFER_OUT_HOOK_HAS_TARGET`        - if set, post-transfer-out hook target is in data (not maker)
 *
 * Mid bits are used for order data offsets (cumulative byte positions):
 * bits 160-223 (64 bits) - packed offsets (4 x uint16)
 *
 * Low bits are used for receiver:
 * bits 0-159 (160 bits) - receiver address (0 if maker)
 */
export class MakerTraits {
  private static SHOULD_UNWRAP_BIT_FLAG = 255n

  private static USE_AQUA_INSTEAD_OF_SIGNATURE_BIT_FLAG = 254n

  private static ALLOW_ZERO_AMOUNT_IN = 253n

  private static HAS_PRE_TRANSFER_IN_HOOK_BIT_FLAG = 252n

  private static HAS_POST_TRANSFER_IN_HOOK_BIT_FLAG = 251n

  private static HAS_PRE_TRANSFER_OUT_HOOK_BIT_FLAG = 250n

  private static HAS_POST_TRANSFER_OUT_HOOK_BIT_FLAG = 249n

  private static PRE_TRANSFER_IN_HOOK_HAS_TARGET = 248n

  private static POST_TRANSFER_IN_HOOK_HAS_TARGET = 247n

  private static PRE_TRANSFER_OUT_HOOK_HAS_TARGET = 246n

  private static POST_TRANSFER_OUT_HOOK_HAS_TARGET = 245n

  private static RECEIVER_MASK = new BitMask(0n, 160n)

  private static ORDER_DATA_SLICES_OFFSETS_MASK = new BitMask(160n, 224n)

  private value: BN

  constructor(val: bigint) {
    this.value = new BN(val)
  }

  static default(): MakerTraits {
    return new MakerTraits(0n).enableUseOfAquaInsteadOfSignature()
  }

  /**
   * Build MakerTraits from individual components
   */
  static fromParams(args: MakerTraitsBuildArgs): MakerTraits {
    const traits = new MakerTraits(0n)

    if (args.shouldUnwrapWeth) {
      traits.withShouldUnwrap()
    }

    if (args.useAquaInsteadOfSignature) {
      traits.enableUseOfAquaInsteadOfSignature()
    }

    if (args.allowZeroAmountIn) {
      traits.enableAllowZeroAmountIn()
    }

    if (args.receiver) {
      traits.withCustomReceiver(args.receiver)
    }

    return traits
  }

  /**
   * Set order data offsets (packed uint64)
   */
  public withOrderDataOffsets(offsets: bigint): this {
    this.value = this.value.setMask(MakerTraits.ORDER_DATA_SLICES_OFFSETS_MASK, offsets)

    return this
  }

  /**
   * Get order data offsets (packed uint64)
   */
  public getOrderDataOffsets(): bigint {
    return this.value.getMask(MakerTraits.ORDER_DATA_SLICES_OFFSETS_MASK).value
  }

  /**
   * Check if should unwrap WETH
   */
  public shouldUnwrapWeth(): boolean {
    return this.value.getBit(MakerTraits.SHOULD_UNWRAP_BIT_FLAG) === 1
  }

  /**
   * Enable WETH unwrapping
   */
  public withShouldUnwrap(): this {
    this.value = this.value.setBit(MakerTraits.SHOULD_UNWRAP_BIT_FLAG, 1)

    return this
  }

  /**
   * Disable WETH unwrapping
   */
  public disableUnwrap(): this {
    this.value = this.value.setBit(MakerTraits.SHOULD_UNWRAP_BIT_FLAG, 0)

    return this
  }

  /**
   * Check if has pre-transfer-in hook target in data (not maker)
   */
  public hasPreTransferInTargetEnabled(): boolean {
    return this.value.getBit(MakerTraits.PRE_TRANSFER_IN_HOOK_HAS_TARGET) === 1
  }

  /**
   * Enable pre-transfer-in hook target in data
   */
  public enablePreTransferInTarget(): this {
    this.value = this.value.setBit(MakerTraits.PRE_TRANSFER_IN_HOOK_HAS_TARGET, 1)

    return this
  }

  /**
   * Check if has post-transfer-in hook target in data (not maker)
   */
  public hasPostTransferInTargetEnabled(): boolean {
    return this.value.getBit(MakerTraits.POST_TRANSFER_IN_HOOK_HAS_TARGET) === 1
  }

  /**
   * Enable post-transfer-in hook target in data
   */
  public enablePostTransferInTarget(): this {
    this.value = this.value.setBit(MakerTraits.POST_TRANSFER_IN_HOOK_HAS_TARGET, 1)

    return this
  }

  /**
   * Check if has pre-transfer-out hook target in data (not maker)
   */
  public hasPreTransferOutTargetEnabled(): boolean {
    return this.value.getBit(MakerTraits.PRE_TRANSFER_OUT_HOOK_HAS_TARGET) === 1
  }

  /**
   * Enable pre-transfer-out hook target in data
   */
  public enablePreTransferOutTarget(): this {
    this.value = this.value.setBit(MakerTraits.PRE_TRANSFER_OUT_HOOK_HAS_TARGET, 1)

    return this
  }

  /**
   * Check if has post-transfer-out hook target in data (not maker)
   */
  public hasPostTransferOutTargetEnabled(): boolean {
    return this.value.getBit(MakerTraits.POST_TRANSFER_OUT_HOOK_HAS_TARGET) === 1
  }

  /**
   * Enable post-transfer-out hook target in data
   */
  public enablePostTransferOutTarget(): this {
    this.value = this.value.setBit(MakerTraits.POST_TRANSFER_OUT_HOOK_HAS_TARGET, 1)

    return this
  }

  /**
   * Check if uses Aqua instead of signature
   */
  public isUseOfAquaInsteadOfSignatureEnabled(): boolean {
    return this.value.getBit(MakerTraits.USE_AQUA_INSTEAD_OF_SIGNATURE_BIT_FLAG) === 1
  }

  /**
   * Enable Aqua instead of signature
   */
  public enableUseOfAquaInsteadOfSignature(): this {
    this.value = this.value.setBit(MakerTraits.USE_AQUA_INSTEAD_OF_SIGNATURE_BIT_FLAG, 1)

    return this
  }

  /**
   * Disable Aqua instead of signature
   */
  public disableUseAquaInsteadOfSignature(): this {
    this.value = this.value.setBit(MakerTraits.USE_AQUA_INSTEAD_OF_SIGNATURE_BIT_FLAG, 0)

    return this
  }

  /**
   * Check if allows zero amount in
   */
  public allowsZeroAmountIn(): boolean {
    return this.value.getBit(MakerTraits.ALLOW_ZERO_AMOUNT_IN) === 1
  }

  /**
   * Enable allowing zero amount in
   */
  public enableAllowZeroAmountIn(): this {
    this.value = this.value.setBit(MakerTraits.ALLOW_ZERO_AMOUNT_IN, 1)

    return this
  }

  /**
   * Check if has hooks
   */
  public hasPreTransferInHook(): boolean {
    return this.value.getBit(MakerTraits.HAS_PRE_TRANSFER_IN_HOOK_BIT_FLAG) === 1
  }

  public hasPostTransferInHook(): boolean {
    return this.value.getBit(MakerTraits.HAS_POST_TRANSFER_IN_HOOK_BIT_FLAG) === 1
  }

  public hasPreTransferOutHook(): boolean {
    return this.value.getBit(MakerTraits.HAS_PRE_TRANSFER_OUT_HOOK_BIT_FLAG) === 1
  }

  public hasPostTransferOutHook(): boolean {
    return this.value.getBit(MakerTraits.HAS_POST_TRANSFER_OUT_HOOK_BIT_FLAG) === 1
  }

  /**
   * Get receiver address
   */
  public customReceiver(): Address | null {
    const receiver = this.value.getMask(MakerTraits.RECEIVER_MASK)

    if (receiver.isZero()) {
      return null
    }

    return Address.fromBigInt(receiver.value)
  }

  /**
   * Set custom receiver address
   */
  public withCustomReceiver(receiver: Address): this {
    const addressBigInt = BigInt(receiver.toString())
    this.value = this.value.setMask(MakerTraits.RECEIVER_MASK, addressBigInt)

    return this
  }

  public asBigInt(): bigint {
    return this.value.value
  }
}
