import {Address, HexString} from '@1inch/sdk-shared'
import {BN, BytesBuilder, BytesIter} from '@1inch/byte-utils'
import assert from 'assert'
import {TakerTraitsBuildArgs} from './types'

/**
 * The TakerTraits is packed bytes structure encoding taker swap preferences.
 *
 * First byte contains flags:
 * bit 0 `IS_EXACT_IN_BIT_FLAG`                   - if set, swap is exact input (vs exact output)
 * bit 1 `SHOULD_UNWRAP_BIT_FLAG`                 - if set, unwrap WETH to ETH for taker
 * bit 2 `HAS_PRE_TRANSFER_IN_BIT_FLAG`           - if set, call pre-transfer-in hook
 * bit 3 `IS_STRICT_THRESHOLD_BIT_FLAG`           - if set, require exact threshold amount match
 * bit 4 `HAS_THRESHOLD_BIT_FLAG`                 - if set, threshold amount follows flags byte
 * bit 5 `HAS_CUSTOM_RECEIVER_BIT_FLAG`                        - if set, custom receiver address follows threshold
 * bit 6 `IS_FIRST_TRANSFER_FROM_TAKER_BIT_FLAG`  - if set, transfer from taker happens first
 * bit 7 `USE_TRANSFER_FROM_AND_AQUA_PUSH`        - if set, use transferFrom + Aqua push pattern
 *
 * Optional fields (variable length):
 * - uint256 threshold (32 bytes) - present if HAS_THRESHOLD_BIT_FLAG is set
 * - address to (20 bytes) - present if HAS_CUSTOM_RECEIVER_BIT_FLAG is set, otherwise defaults to taker
 */
export class TakerTraits {
    private static IS_EXACT_IN_BIT_FLAG = 0n

    private static SHOULD_UNWRAP_BIT_FLAG = 1n

    private static HAS_PRE_TRANSFER_IN_BIT_FLAG = 2n

    private static IS_STRICT_THRESHOLD_BIT_FLAG = 3n

    private static HAS_THRESHOLD_BIT_FLAG = 4n

    private static HAS_CUSTOM_RECEIVER_BIT_FLAG = 5n

    private static IS_FIRST_TRANSFER_FROM_TAKER_BIT_FLAG = 6n

    private static USE_TRANSFER_FROM_AND_AQUA_PUSH_BIT_FLAG = 7n

    private flags: BN

    private threshold?: bigint

    private customReceiver?: Address

    constructor(
        val: bigint = 0n,
        data: {
            threshold?: bigint
            to?: Address
        }
    ) {
        this.flags = new BN(val)

        this.threshold = data.threshold
        this.customReceiver = data.to

        this.setThresholdBit(Boolean(this.threshold))

        const hasCustomReceiver = Boolean(
            this.customReceiver && !this.customReceiver.isZero()
        )

        this.setCustomReceiverBit(hasCustomReceiver)
    }

    static default(): TakerTraits {
        return new TakerTraits(0n, {}).withExactIn()
    }

    /**
     * Build TakerTraits from individual components
     */
    static fromParams(args: TakerTraitsBuildArgs): TakerTraits {
        const traits = TakerTraits.default()

        if (args.isExactIn) {
            traits.withExactIn()
        }

        if (args.shouldUnwrapWeth) {
            traits.withShouldUnwrap()
        }

        if (args.hasPreTransferInHook) {
            traits.withPreTransferInHook()
        }

        if (args.isStrictThresholdAmount) {
            traits.withStrictThreshold()
        }

        if (args.isFirstTransferFromTaker) {
            traits.withFirstTransferFromTaker()
        }

        if (args.useTransferFromAndAquaPush) {
            traits.withUseTransferFromAndAquaPush()
        }

        if (args.threshold) {
            traits.withThreshold(args.threshold)
        }

        if (args.customReceiver && !args.customReceiver.isZero()) {
            traits.withCustomReceiver(args.customReceiver)
        }

        return traits
    }

    /**
     * Decode TakerTraits from packed bytes
     * @param data - Packed bytes from the contract (variable length: 1-53 bytes)
     * @returns Decoded TakerTraits instance
     */
    static fromBytes(data: HexString): TakerTraits {
        const iter = BytesIter.BigInt(data.toString())
        const flagsByte = iter.nextByte()
        const flags = new BN(flagsByte)

        const hasThreshold =
            flags.getBit(TakerTraits.HAS_THRESHOLD_BIT_FLAG) === 1
        const hasCustomReceiver =
            flags.getBit(TakerTraits.HAS_CUSTOM_RECEIVER_BIT_FLAG) === 1

        const optionalFields = {
            threshold: hasThreshold ? iter.nextUint256() : undefined,
            to: hasCustomReceiver
                ? Address.fromBigInt(iter.nextUint160())
                : undefined
        }

        return new TakerTraits(flagsByte, optionalFields)
    }

    /**
     * Encode TakerTraits to packed bytes
     * @returns Packed bytes (1-53 bytes depending on optional fields)
     */
    public encode(): HexString {
        const builder = new BytesBuilder()

        builder.addByte(this.flags)

        if (this.hasThreshold()) {
            assert(
                this.threshold,
                'threshold required if threshold flag is set'
            )
            builder.addUint256(this.threshold)
        }

        if (this.hasCustomReceiver()) {
            assert(
                this.customReceiver && !this.customReceiver.isZero(),
                'customReceiver required if customReceiver flag is set'
            )
            builder.addUint160(BigInt(this.customReceiver.toString()))
        }

        return new HexString(builder.asHex())
    }

    /**
     * Check if exact input swap
     */
    public isExactIn(): boolean {
        return this.flags.getBit(TakerTraits.IS_EXACT_IN_BIT_FLAG) === 1
    }

    /**
     * Enable exact input mode (sets exact input flag to 1)
     * "I have exactly X tokens to swap"
     */
    public withExactIn(): this {
        this.flags = this.flags.setBit(TakerTraits.IS_EXACT_IN_BIT_FLAG, 1)

        return this
    }

    /**
     * Enable exact output mode
     * Sets IS_EXACT_IN flag to 0 (exact input = false means exact output)
     * "I want exactly X output tokens, calculate input needed"
     */
    public withExactOut(): this {
        this.flags = this.flags.setBit(TakerTraits.IS_EXACT_IN_BIT_FLAG, 0)

        return this
    }

    /**
     * Check if should unwrap WETH
     */
    public shouldUnwrapWeth(): boolean {
        return this.flags.getBit(TakerTraits.SHOULD_UNWRAP_BIT_FLAG) === 1
    }

    /**
     * Enable WETH unwrapping
     */
    public withShouldUnwrap(): this {
        this.flags = this.flags.setBit(TakerTraits.SHOULD_UNWRAP_BIT_FLAG, 1)

        return this
    }

    /**
     * Disable WETH unwrapping
     */
    public withoutShouldUnwrap(): this {
        this.flags = this.flags.setBit(TakerTraits.SHOULD_UNWRAP_BIT_FLAG, 0)

        return this
    }

    /**
     * Check if has pre-transfer-in hook
     */
    public hasPreTransferInHook(): boolean {
        return this.flags.getBit(TakerTraits.HAS_PRE_TRANSFER_IN_BIT_FLAG) === 1
    }

    /**
     * Enable pre-transfer-in hook
     */
    public withPreTransferInHook(): this {
        this.flags = this.flags.setBit(
            TakerTraits.HAS_PRE_TRANSFER_IN_BIT_FLAG,
            1
        )

        return this
    }

    /**
     * Disable pre-transfer-in hook
     */
    public withoutPreTransferInHook(): this {
        this.flags = this.flags.setBit(
            TakerTraits.HAS_PRE_TRANSFER_IN_BIT_FLAG,
            0
        )

        return this
    }

    /**
     * Check if strict threshold
     */
    public isStrictThresholdAmount(): boolean {
        return this.flags.getBit(TakerTraits.IS_STRICT_THRESHOLD_BIT_FLAG) === 1
    }

    /**
     * Enable strict threshold
     */
    public withStrictThreshold(): this {
        this.flags = this.flags.setBit(
            TakerTraits.IS_STRICT_THRESHOLD_BIT_FLAG,
            1
        )

        return this
    }

    /**
     * Disable strict threshold
     */
    public withoutStrictThreshold(): this {
        this.flags = this.flags.setBit(
            TakerTraits.IS_STRICT_THRESHOLD_BIT_FLAG,
            0
        )

        return this
    }

    /**
     * Check if has threshold
     */
    public hasThreshold(): boolean {
        return this.flags.getBit(TakerTraits.HAS_THRESHOLD_BIT_FLAG) === 1
    }

    /**
     * Get threshold amount
     */
    public getThreshold(): bigint | undefined {
        return this.threshold
    }

    /**
     * Set threshold amount
     */
    public withThreshold(amount: bigint): this {
        assert(amount > 0n, 'Threshold must be positive')

        this.threshold = amount
        this.setThresholdBit(true)

        return this
    }

    /**
     * Remove threshold
     */
    public withoutThreshold(): this {
        this.threshold = undefined
        this.setThresholdBit(false)

        return this
    }

    /**
     * Check if has custom receiver
     */
    public hasCustomReceiver(): boolean {
        return this.flags.getBit(TakerTraits.HAS_CUSTOM_RECEIVER_BIT_FLAG) === 1
    }

    /**
     * Get receiver address
     */
    public getTo(): Address | undefined {
        return this.customReceiver
    }

    /**
     * Set receiver address
     */
    public withCustomReceiver(receiver: Address): this {
        assert(
            !receiver.isZero(),
            'Use withoutCustomReceiver() to use default taker'
        )

        this.setCustomReceiverBit(true)
        this.customReceiver = receiver

        return this
    }

    /**
     * Remove custom receiver
     */
    public withoutCustomReceiver(): this {
        this.customReceiver = undefined
        this.setCustomReceiverBit(false)

        return this
    }

    /**
     * Check if first transfer from taker
     */
    public isFirstTransferFromTaker(): boolean {
        return (
            this.flags.getBit(
                TakerTraits.IS_FIRST_TRANSFER_FROM_TAKER_BIT_FLAG
            ) === 1
        )
    }

    /**
     * Enable first transfer from taker
     */
    public withFirstTransferFromTaker(): this {
        this.flags = this.flags.setBit(
            TakerTraits.IS_FIRST_TRANSFER_FROM_TAKER_BIT_FLAG,
            1
        )

        return this
    }

    /**
     * Disable first transfer from taker
     */
    public withoutFirstTransferFromTaker(): this {
        this.flags = this.flags.setBit(
            TakerTraits.IS_FIRST_TRANSFER_FROM_TAKER_BIT_FLAG,
            0
        )

        return this
    }

    /**
     * Check if using transferFrom and Aqua push
     */
    public isUseTransferFromAndAquaPush(): boolean {
        return (
            this.flags.getBit(
                TakerTraits.USE_TRANSFER_FROM_AND_AQUA_PUSH_BIT_FLAG
            ) === 1
        )
    }

    /**
     * Enable transferFrom and Aqua push
     */
    public withUseTransferFromAndAquaPush(): this {
        this.flags = this.flags.setBit(
            TakerTraits.USE_TRANSFER_FROM_AND_AQUA_PUSH_BIT_FLAG,
            1
        )

        return this
    }

    /**
     * Disable transferFrom and Aqua push
     */
    public withoutUseTransferFromAndAquaPush(): this {
        this.flags = this.flags.setBit(
            TakerTraits.USE_TRANSFER_FROM_AND_AQUA_PUSH_BIT_FLAG,
            0
        )

        return this
    }

    /**
     * Get flags as BN
     */
    public getFlags(): BN {
        return this.flags
    }

    /**
     * Validate taker traits against swap amounts
     * Matches Solidity validate() function logic
     * @param amountIn - Amount of tokens going in
     * @param amountOut - Amount of tokens going out
     * @throws Error if validation fails
     * @see https://github.com/1inch/swap-vm/blob/main/src/libs/TakerTraits.sol#L114
     */
    public validate(amountIn: bigint, amountOut: bigint): void {
        if (!this.hasThreshold() || this.threshold === undefined) {
            return
        }

        const threshold = this.threshold

        if (this.isStrictThresholdAmount()) {
            assert(
                amountOut === threshold,
                `TakerTraitsNonExactThresholdAmount: amountOut ${amountOut} != threshold ${threshold}`
            )
        } else {
            if (this.isExactIn()) {
                assert(
                    amountOut >= threshold,
                    `TakerTraitsInsufficientMinOutputAmount: amountOut ${amountOut} < threshold ${threshold}`
                )
            } else {
                assert(
                    amountIn <= threshold,
                    `TakerTraitsExceedingMaxInputAmount: amountIn ${amountIn} > threshold ${threshold}`
                )
            }
        }
    }

    private setThresholdBit(val: boolean): this {
        this.flags = this.flags.setBit(TakerTraits.HAS_THRESHOLD_BIT_FLAG, val)

        return this
    }

    private setCustomReceiverBit(val: boolean): this {
        this.flags = this.flags.setBit(
            TakerTraits.HAS_CUSTOM_RECEIVER_BIT_FLAG,
            val
        )

        return this
    }
}
