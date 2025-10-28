import {BitMask, BN} from '@1inch/byte-utils'
import {Address} from '@1inch/sdk-shared'
import {MakerTraitsBuildArgs} from './types'

/**
 * The MakerTraits type is a uint256, and different parts of the number are used to encode different traits.
 * High bits are used for flags:
 * 255 bit `SHOULD_UNWRAP_BIT_FLAG`              - if set, the order should unwrap WETH
 * 254 bit `HAS_PRE_TRANSFER_OUT_BIT_FLAG`       - if set, the order has pre-transfer-out hook
 * 253 bit `HAS_POST_TRANSFER_IN_BIT_FLAG`       - if set, the order has post-transfer-in hook
 * 252 bit `USE_AQUA_INSTEAD_OF_SIGNATURE_BIT_FLAG` - if set, use Aqua instead of signature
 * 251 bit `IGNORE_AQUA_FOR_TRANSFER_IN_BIT_FLAG`   - if set, ignore Aqua for transfer in
 *
 * Mid bits are used for data lengths:
 * bits 216-231 (16 bits) - post transfer in data length
 * bits 200-215 (16 bits) - pre transfer out data length
 *
 * Low bits are used for expiration and receiver:
 * bits 160-199 (40 bits) - expiration timestamp
 * bits 0-159 (160 bits) - receiver address (0 if maker)
 */
export class MakerTraits {
    private static SHOULD_UNWRAP_BIT_FLAG = 255n

    private static HAS_PRE_TRANSFER_OUT_BIT_FLAG = 254n

    private static HAS_POST_TRANSFER_IN_BIT_FLAG = 253n

    private static USE_AQUA_INSTEAD_OF_SIGNATURE_BIT_FLAG = 252n

    private static IGNORE_AQUA_FOR_TRANSFER_IN_BIT_FLAG = 251n

    private static RECEIVER_MASK = new BitMask(0n, 160n)

    private static EXPIRATION_MASK = new BitMask(160n, 200n)

    private static PRE_TRANSFER_OUT_DATA_LENGTH_MASK = new BitMask(200n, 216n)

    private static POST_TRANSFER_IN_DATA_LENGTH_MASK = new BitMask(216n, 232n)

    private value: BN

    constructor(val: bigint) {
        this.value = new BN(val)
    }

    static default(): MakerTraits {
        return new MakerTraits(0n)
    }

    /**
     * Build MakerTraits from individual components
     */
    static fromParams(args: MakerTraitsBuildArgs): MakerTraits {
        const traits = new MakerTraits(0n)

        if (args.shouldUnwrapWeth) {
            traits.withShouldUnwrap()
        }

        if (args.hasPreTransferOutHook) {
            traits.enablePreTransferOutHook()
        }

        if (args.hasPostTransferInHook) {
            traits.enablePostTransferInHook()
        }

        if (args.useAquaInsteadOfSignature) {
            traits.enableUseOfAquaInsteadOfSignature()
        }

        if (args.ignoreAquaForTransferIn) {
            traits.enableIgnoreOfAquaForTransferIn()
        }

        if (args.expiration && args.expiration > 0n) {
            traits.withExpiration(args.expiration)
        }

        if (args.receiver) {
            traits.withCustomReceiver(args.receiver)
        }

        if (args.preTransferOutDataLength !== undefined) {
            traits.withPreTransferOutDataLength(args.preTransferOutDataLength)
        }

        if (args.postTransferInDataLength !== undefined) {
            traits.withPostTransferInDataLength(args.postTransferInDataLength)
        }

        return traits
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
     * Check if has pre-transfer-out hook
     */
    public hasPreTransferOutHook(): boolean {
        return (
            this.value.getBit(MakerTraits.HAS_PRE_TRANSFER_OUT_BIT_FLAG) === 1
        )
    }

    /**
     * Enable pre-transfer-out hook
     */
    public enablePreTransferOutHook(): this {
        this.value = this.value.setBit(
            MakerTraits.HAS_PRE_TRANSFER_OUT_BIT_FLAG,
            1
        )

        return this
    }

    /**
     * Disable pre-transfer-out hook
     */
    public disablePreTransferOutHook(): this {
        this.value = this.value.setBit(
            MakerTraits.HAS_PRE_TRANSFER_OUT_BIT_FLAG,
            0
        )

        return this
    }

    /**
     * Check if has post-transfer-in hook
     */
    public hasPostTransferInHook(): boolean {
        return (
            this.value.getBit(MakerTraits.HAS_POST_TRANSFER_IN_BIT_FLAG) === 1
        )
    }

    /**
     * Enable post-transfer-in hook
     */
    public enablePostTransferInHook(): this {
        this.value = this.value.setBit(
            MakerTraits.HAS_POST_TRANSFER_IN_BIT_FLAG,
            1
        )

        return this
    }

    /**
     * Disable post-transfer-in hook
     */
    public disablePostTransferInHook(): this {
        this.value = this.value.setBit(
            MakerTraits.HAS_POST_TRANSFER_IN_BIT_FLAG,
            0
        )

        return this
    }

    /**
     * Check if uses Aqua instead of signature
     */
    public isUseOfAquaInsteadOfSignatureEnabled(): boolean {
        return (
            this.value.getBit(
                MakerTraits.USE_AQUA_INSTEAD_OF_SIGNATURE_BIT_FLAG
            ) === 1
        )
    }

    /**
     * Enable Aqua instead of signature
     */
    public enableUseOfAquaInsteadOfSignature(): this {
        this.value = this.value.setBit(
            MakerTraits.USE_AQUA_INSTEAD_OF_SIGNATURE_BIT_FLAG,
            1
        )

        return this
    }

    /**
     * Disable Aqua instead of signature
     */
    public disableUseAquaInsteadOfSignature(): this {
        this.value = this.value.setBit(
            MakerTraits.USE_AQUA_INSTEAD_OF_SIGNATURE_BIT_FLAG,
            0
        )

        return this
    }

    /**
     * Check if ignores Aqua for transfer in
     */
    public isIgnoreOfAquaForTransferInEnabled(): boolean {
        return (
            this.value.getBit(
                MakerTraits.IGNORE_AQUA_FOR_TRANSFER_IN_BIT_FLAG
            ) === 1
        )
    }

    /**
     * Enable ignoring Aqua for transfer in
     */
    public enableIgnoreOfAquaForTransferIn(): this {
        this.value = this.value.setBit(
            MakerTraits.IGNORE_AQUA_FOR_TRANSFER_IN_BIT_FLAG,
            1
        )

        return this
    }

    /**
     * Disable ignoring Aqua for transfer in
     */
    public disableIgnoreAquaForTransferIn(): this {
        this.value = this.value.setBit(
            MakerTraits.IGNORE_AQUA_FOR_TRANSFER_IN_BIT_FLAG,
            0
        )

        return this
    }

    /**
     * Get expiration timestamp
     */
    public expiration(): bigint | null {
        const timestampSec = this.value.getMask(MakerTraits.EXPIRATION_MASK)

        if (timestampSec.isZero()) {
            return null
        }

        return timestampSec.value
    }

    /**
     * Set expiration timestamp
     */
    public withExpiration(expiration: bigint): this {
        const expirationSec = expiration === null ? 0n : expiration

        this.value = this.value.setMask(
            MakerTraits.EXPIRATION_MASK,
            expirationSec
        )

        return this
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
        this.value = this.value.setMask(
            MakerTraits.RECEIVER_MASK,
            addressBigInt
        )

        return this
    }

    /**
     * Get pre-transfer-out hook data length
     */
    public preTransferOutDataLength(): bigint {
        return this.value.getMask(MakerTraits.PRE_TRANSFER_OUT_DATA_LENGTH_MASK)
            .value
    }

    /**
     * Set pre-transfer-out hook data length
     */
    public withPreTransferOutDataLength(length: bigint): this {
        this.value = this.value.setMask(
            MakerTraits.PRE_TRANSFER_OUT_DATA_LENGTH_MASK,
            length
        )

        return this
    }

    /**
     * Get post-transfer-in hook data length
     */
    public postTransferInDataLength(): bigint {
        return this.value.getMask(MakerTraits.POST_TRANSFER_IN_DATA_LENGTH_MASK)
            .value
    }

    /**
     * Set post-transfer-in hook data length
     */
    public withPostTransferInDataLength(length: bigint): this {
        this.value = this.value.setMask(
            MakerTraits.POST_TRANSFER_IN_DATA_LENGTH_MASK,
            length
        )

        return this
    }

    public asBigInt(): bigint {
        return this.value.value
    }
}
