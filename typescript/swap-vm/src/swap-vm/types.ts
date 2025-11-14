import type { Address, HexString } from '@1inch/sdk-core'

export type MakerTraitsBuildArgs = {
  shouldUnwrapWeth?: boolean
  useAquaInsteadOfSignature?: boolean
  allowZeroAmountIn?: boolean
  receiver?: Address
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

export type MakerDataArgs = {
  preTransferInTarget?: Address
  preTransferInData?: HexString
  postTransferInTarget?: Address
  postTransferInData?: HexString
  preTransferOutTarget?: Address
  preTransferOutData?: HexString
  postTransferOutTarget?: Address
  postTransferOutData?: HexString
  program: HexString
}
