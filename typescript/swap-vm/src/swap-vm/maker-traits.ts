// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BN, BitMask } from '@1inch/byte-utils'
import type { DataFor } from '@1inch/sdk-core'
import { Interaction, HexString, Address } from '@1inch/sdk-core'

/**
 * Maker-side order configuration packed into a single `uint256` and an optional hooks data blob.
 *
 * This class mirrors the on-chain `MakerTraits` bit layout and encoding used by the SwapVM
 * contracts. It is responsible for:
 *
 * - maker preferences (unwrap WETH, allow zero amount in, Aqua vs signature)
 * - selecting an optional custom receiver
 * - wiring pre/post transfer hooks and their optional targets/payloads
 *
 * The ABI-level representation is:
 * - `traits`  – a `uint256` where:
 *   - high bits 245–255 store boolean flags
 *   - bits 160–223 store cumulative offsets for hook data slices (4 × `uint16`)
 *   - bits   0–159 store the receiver address (0 means "maker")
 * - `hooksData` – concatenation of hook payloads in the order:
 *   `preTransferIn`, `postTransferIn`, `preTransferOut`, `postTransferOut`
 */
export class MakerTraits {
  private static HOOKS = [
    'preTransferInHook',
    'postTransferInHook',
    'preTransferOutHook',
    'postTransferOutHook',
  ] as const

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

  private static CUSTOM_RECEIVER_MASK = new BitMask(0n, 160n)

  private static HOOKS_DATA_OFFSETS_MASK = new BitMask(160n, 224n)

  constructor(
    /**
     * If true, maker WETH proceeds are unwrapped into the native currency when
     * the order is settled.
     */
    public readonly shouldUnwrap: boolean,
    /**
     * If true, the order is intended to be authenticated via Aqua (push-based
     * mechanism) instead of a traditional ECDSA signature.
     */
    public readonly useAquaInsteadOfSignature: boolean,
    /**
     * If true, the order accepts `amountIn = 0`. This is useful for flows
     * where the effective input is determined by hooks or Aqua rather than the
     * taker-supplied amount.
     */
    public readonly allowZeroAmountIn: boolean,
    /**
     * Optional receiver of the maker's output assets. When omitted or equal to
     * the zero address, the maker address is used as the receiver.
     */
    public readonly customReceiver?: Address,
    /**
     * Optional hook executed before tokens are transferred *into* the maker
     * side of the swap. The `Interaction` can carry both target and calldata.
     * When the hook should be called on the maker itself, `Interaction.target`
     * must be the zero address.
     */
    public readonly preTransferInHook?: Interaction,
    /**
     * Optional hook executed after tokens are transferred *into* the maker
     * side of the swap. When the hook should be called on the maker itself,
     * `Interaction.target` must be the zero address.
     */
    public readonly postTransferInHook?: Interaction,
    /**
     * Optional hook executed before tokens are transferred *out of* the maker
     * side of the swap. When the hook should be called on the maker itself,
     * `Interaction.target` must be the zero address.
     */
    public readonly preTransferOutHook?: Interaction,
    /**
     * Optional hook executed after tokens are transferred *out of* the maker
     * side of the swap. When the hook should be called on the maker itself,
     * `Interaction.target` must be the zero address.
     */
    public readonly postTransferOutHook?: Interaction,
  ) {}

  /**
   * Construct traits from a plain data object.
   */
  static new(data: DataFor<MakerTraits>): MakerTraits {
    return new MakerTraits(
      data.shouldUnwrap,
      data.useAquaInsteadOfSignature,
      data.allowZeroAmountIn,
      data.customReceiver,
      data.preTransferInHook,
      data.postTransferInHook,
      data.preTransferOutHook,
      data.postTransferOutHook,
    )
  }

  /**
   * Create traits with library defaults that match the on-chain SwapVM expectations:
   * - `useAquaInsteadOfSignature` = `true`
   * - `shouldUnwrap`             = `false`
   * - `allowZeroAmountIn`        = `false`
   * - no receiver or hooks configured.
   */
  static default(): MakerTraits {
    return MakerTraits.new({
      useAquaInsteadOfSignature: true,
      allowZeroAmountIn: false,
      shouldUnwrap: false,
    })
  }

  /**
   * Decode ABI-level representation into a `MakerTraits` instance.
   *
   * @param traits    Packed `uint256` bitfield as produced by {@link encode}.
   * @param hooksData Concatenated hooks payloads in the format expected by SwapVM
   *                  contracts (may be `HexString.EMPTY` when no hooks are present).
   *
   * Both arguments are typically obtained from contract storage / ABI and must
   * follow the bit layout described in the class-level documentation.
   */
  static decode(traits: bigint, hooksData = HexString.EMPTY): MakerTraits {
    const traitsBN = new BN(traits)
    const shouldUnwrap = traitsBN.getBit(MakerTraits.SHOULD_UNWRAP_BIT_FLAG)
    const useAquaInsteadOfSignature = traitsBN.getBit(
      MakerTraits.USE_AQUA_INSTEAD_OF_SIGNATURE_BIT_FLAG,
    )
    const allowZeroAmountIn = traitsBN.getBit(MakerTraits.ALLOW_ZERO_AMOUNT_IN)
    const customReceiver = Address.fromBigInt(
      traitsBN.getMask(MakerTraits.CUSTOM_RECEIVER_MASK).value,
    )
    const hooksDataOffsets = traitsBN.getMask(MakerTraits.HOOKS_DATA_OFFSETS_MASK).value

    const hasPreTransferInHook = Boolean(
      traitsBN.getBit(MakerTraits.HAS_PRE_TRANSFER_IN_HOOK_BIT_FLAG),
    )
    const hasPreTransferInHookTarget = Boolean(
      traitsBN.getBit(MakerTraits.PRE_TRANSFER_IN_HOOK_HAS_TARGET),
    )

    const preTransferInHook = parseHook(
      hooksData,
      hasPreTransferInHook,
      hasPreTransferInHookTarget,
      hooksDataOffsets,
      0,
    )

    const hasPostTransferInHook = Boolean(
      traitsBN.getBit(MakerTraits.HAS_POST_TRANSFER_IN_HOOK_BIT_FLAG),
    )
    const hasPostTransferInHookTarget = Boolean(
      traitsBN.getBit(MakerTraits.POST_TRANSFER_IN_HOOK_HAS_TARGET),
    )

    const postTransferInHook = parseHook(
      hooksData,
      hasPostTransferInHook,
      hasPostTransferInHookTarget,
      hooksDataOffsets,
      1,
    )

    const hasPreTransferOutHook = Boolean(
      traitsBN.getBit(MakerTraits.HAS_PRE_TRANSFER_OUT_HOOK_BIT_FLAG),
    )
    const hasPreTransferOutHookTarget = Boolean(
      traitsBN.getBit(MakerTraits.PRE_TRANSFER_OUT_HOOK_HAS_TARGET),
    )
    const preTransferOutHook = parseHook(
      hooksData,
      hasPreTransferOutHook,
      hasPreTransferOutHookTarget,
      hooksDataOffsets,
      2,
    )

    const hasPostTransferOutHook = Boolean(
      traitsBN.getBit(MakerTraits.HAS_POST_TRANSFER_OUT_HOOK_BIT_FLAG),
    )
    const hasPostTransferOutHookTarget = Boolean(
      traitsBN.getBit(MakerTraits.POST_TRANSFER_OUT_HOOK_HAS_TARGET),
    )

    const postTransferOutHook = parseHook(
      hooksData,
      hasPostTransferOutHook,
      hasPostTransferOutHookTarget,
      hooksDataOffsets,
      3,
    )

    return MakerTraits.new({
      useAquaInsteadOfSignature: Boolean(useAquaInsteadOfSignature),
      allowZeroAmountIn: Boolean(allowZeroAmountIn),
      shouldUnwrap: Boolean(shouldUnwrap),
      customReceiver: customReceiver.isZero() ? undefined : customReceiver,
      preTransferInHook,
      postTransferInHook,
      preTransferOutHook,
      postTransferOutHook,
    })
  }

  static hooksDataEndsAtByte(traits: bigint): number {
    const bn = new BN(traits)
    const offsets = bn.getMask(MakerTraits.HOOKS_DATA_OFFSETS_MASK).value
    const dataEndAt = Number((offsets >> (16n * BigInt(MakerTraits.HOOKS.length - 1))) & 0xffffn)

    return dataEndAt
  }

  /**
   * Mutate the traits instance in-place with a partial update and return it.
   *
   * This is primarily used for fluent-style construction in tests and examples, e.g.:
   *
   * `MakerTraits.default().with({ shouldUnwrap: true })`
   *
   * Only fields present in `data` are updated; flags, receiver, and hooks can be
   * changed independently.
   */
  public with(data: Partial<DataFor<MakerTraits>>): this {
    Object.assign(this, data)

    return this
  }

  /**
   * Encode traits into the ABI format expected by SwapVM contracts.
   *
   * @param maker - Maker address for this order. This parameter is required only
   *                for gas/size optimisation; if omitted, any non-zero hook `target`
   *                is treated as an explicit target.
   *
   * @returns An object containing:
   *   - `traits`    - Packed `uint256` bitfield with flags, receiver and offsets
   *   - `hooksData` - Concatenation of hook segments for all configured hooks
   *
   * ## Bit Layout of `traits` (uint256)
   *
   * ```
   * 255                                                          0
   * +------------+----------------------------+------------------+
   * | Flags      | Hook Offsets (4×uint16)    | Receiver Address |
   * | [255-245]  | [223-160]                  | [159-0]          |
   * +------------+----------------------------+------------------+
   * ```
   *
   * ## Flags (by bit index)
   *
   * | Bit | Flag Name                                |
   * |-----|------------------------------------------|
   * | 255 | SHOULD_UNWRAP_BIT_FLAG                   |
   * | 254 | USE_AQUA_INSTEAD_OF_SIGNATURE_BIT_FLAG   |
   * | 253 | ALLOW_ZERO_AMOUNT_IN                     |
   * | 252 | HAS_PRE_TRANSFER_IN_HOOK_BIT_FLAG        |
   * | 251 | HAS_POST_TRANSFER_IN_HOOK_BIT_FLAG       |
   * | 250 | HAS_PRE_TRANSFER_OUT_HOOK_BIT_FLAG       |
   * | 249 | HAS_POST_TRANSFER_OUT_HOOK_BIT_FLAG      |
   * | 248 | PRE_TRANSFER_IN_HOOK_HAS_TARGET          |
   * | 247 | POST_TRANSFER_IN_HOOK_HAS_TARGET         |
   * | 246 | PRE_TRANSFER_OUT_HOOK_HAS_TARGET         |
   * | 245 | POST_TRANSFER_OUT_HOOK_HAS_TARGET        |
   */
  public encode(maker?: Address): { traits: bigint; hooksData: HexString } {
    let traits = new BN(0n)

    // flags
    traits = traits.setBit(MakerTraits.SHOULD_UNWRAP_BIT_FLAG, this.shouldUnwrap)
    traits = traits.setBit(
      MakerTraits.USE_AQUA_INSTEAD_OF_SIGNATURE_BIT_FLAG,
      this.useAquaInsteadOfSignature,
    )
    traits = traits.setBit(MakerTraits.ALLOW_ZERO_AMOUNT_IN, this.allowZeroAmountIn)

    // has hooks
    traits = traits.setBit(
      MakerTraits.HAS_PRE_TRANSFER_IN_HOOK_BIT_FLAG,
      this.preTransferInHook !== undefined,
    )
    traits = traits.setBit(
      MakerTraits.HAS_POST_TRANSFER_IN_HOOK_BIT_FLAG,
      this.postTransferInHook !== undefined,
    )
    traits = traits.setBit(
      MakerTraits.HAS_PRE_TRANSFER_OUT_HOOK_BIT_FLAG,
      this.preTransferOutHook !== undefined,
    )
    traits = traits.setBit(
      MakerTraits.HAS_POST_TRANSFER_OUT_HOOK_BIT_FLAG,
      this.postTransferOutHook !== undefined,
    )

    // has hook targets
    traits = traits.setBit(
      MakerTraits.PRE_TRANSFER_IN_HOOK_HAS_TARGET,
      this.hasTargetForHook('preTransferInHook', maker),
    )
    traits = traits.setBit(
      MakerTraits.POST_TRANSFER_IN_HOOK_HAS_TARGET,
      this.hasTargetForHook('postTransferInHook', maker),
    )
    traits = traits.setBit(
      MakerTraits.PRE_TRANSFER_OUT_HOOK_HAS_TARGET,
      this.hasTargetForHook('preTransferOutHook', maker),
    )
    traits = traits.setBit(
      MakerTraits.POST_TRANSFER_OUT_HOOK_HAS_TARGET,
      this.hasTargetForHook('postTransferOutHook', maker),
    )

    traits = traits.setMask(
      MakerTraits.CUSTOM_RECEIVER_MASK,
      BigInt(this.customReceiver?.toString() || 0n),
    )

    const { data, offsets } = MakerTraits.HOOKS.reduce(
      (acc, hookName, i) => {
        const hook = this[hookName]
        const hasTarget = this.hasTargetForHook(hookName)
        const encoded = hook && hasTarget ? hook.encode() : hook?.data || HexString.EMPTY

        acc.sum += BigInt(encoded.bytesCount())
        acc.offsets += acc.sum << (16n * BigInt(i))
        acc.data = acc.data.concat(encoded)

        return acc
      },
      { data: HexString.EMPTY, offsets: 0n, sum: 0n },
    )

    traits = traits.setMask(MakerTraits.HOOKS_DATA_OFFSETS_MASK, offsets)

    return {
      traits: traits.value,
      hooksData: data,
    }
  }

  private hasTargetForHook(
    hookName: (typeof MakerTraits.HOOKS)[number],
    maker: Address = Address.ZERO_ADDRESS,
  ): boolean {
    const hook = this[hookName]

    if (!hook) {
      return false
    }

    return !(hook.target.isZero() || hook.target.equal(maker))
  }
}

function parseHook(
  fullHookData: HexString,
  hasHook: boolean,
  hasHookTarget: boolean,
  offsets: bigint,
  idx: number,
): Interaction | undefined {
  if (!hasHook) {
    return undefined
  }

  const startDataIdx = idx === 0 ? 0 : Number((offsets >> (16n * BigInt(idx - 1))) & 0xffffn)
  const endDataIdx = Number((offsets >> (16n * BigInt(idx))) & 0xffffn)
  const hookData = fullHookData.sliceBytes(startDataIdx, endDataIdx)

  if (!hasHookTarget) {
    return new Interaction(Address.ZERO_ADDRESS, hookData)
  }

  return Interaction.decode(hookData)
}
