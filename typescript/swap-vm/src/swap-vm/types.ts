import {Address} from '@1inch/sdk-shared'

export type MakerTraitsBuildArgs = {
    shouldUnwrapWeth?: boolean
    hasPreTransferOutHook?: boolean
    hasPostTransferInHook?: boolean
    useAquaInsteadOfSignature?: boolean
    ignoreAquaForTransferIn?: boolean
    expiration?: bigint
    receiver?: Address
    preTransferOutDataLength?: bigint
    postTransferInDataLength?: bigint
}

export type TakerTraitsBuildArgs = {
    isExactIn?: boolean
    shouldUnwrapWeth?: boolean
    hasPreTransferInHook?: boolean
    isStrictThresholdAmount?: boolean
    isFirstTransferFromTaker?: boolean
    useTransferFromAndAquaPush?: boolean
    threshold?: bigint
    customReceiver?: Address
}
