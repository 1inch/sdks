import type { Address } from '@1inch/sdk-core'
import { HexString } from '@1inch/sdk-core'
import { add0x, trim0x } from '@1inch/byte-utils'
import type { MakerDataArgs } from './types'

export class MakerData {
  public static readonly EMPTY: MakerDataArgs = {
    preTransferInData: HexString.EMPTY,
    postTransferInData: HexString.EMPTY,
    preTransferOutData: HexString.EMPTY,
    postTransferOutData: HexString.EMPTY,
    program: HexString.EMPTY,
  }

  /**
   * Encodes maker data and returns both the packed data and the offsets to be stored in MakerTraits
   */
  public static encode(
    args: MakerDataArgs,
    maker: Address,
  ): {
    data: HexString
    offsets: bigint
    hasPreTransferInTarget: boolean
    hasPostTransferInTarget: boolean
    hasPreTransferOutTarget: boolean
    hasPostTransferOutTarget: boolean
  } {
    const sectionsWithFlags = [
      this.buildSection(maker, args.preTransferInTarget, args.preTransferInData),
      this.buildSection(maker, args.postTransferInTarget, args.postTransferInData),
      this.buildSection(maker, args.preTransferOutTarget, args.preTransferOutData),
      this.buildSection(maker, args.postTransferOutTarget, args.postTransferOutData),
    ]

    const sections = sectionsWithFlags.map((s) => s.data)

    const cumulativeSum = (
      (sum) =>
      (value: number): number => {
        sum += value

        return sum
      }
    )(0)

    const offsets = sections
      .map((s) => s.length / 2)
      .map(cumulativeSum)
      .reduce((acc, offset, i) => acc + (BigInt(offset) << BigInt(16 * i)), 0n)

    const allData = sections.join('') + trim0x(args.program.toString())

    return {
      data: new HexString(add0x(allData)),
      offsets,
      hasPreTransferInTarget: sectionsWithFlags[0].hasTarget,
      hasPostTransferInTarget: sectionsWithFlags[1].hasTarget,
      hasPreTransferOutTarget: sectionsWithFlags[2].hasTarget,
      hasPostTransferOutTarget: sectionsWithFlags[3].hasTarget,
    }
  }

  private static buildSection(
    maker: Address,
    target?: Address,
    data?: HexString,
  ): { data: string; hasTarget: boolean } {
    const hasTarget = Boolean(target && !target.isZero() && !target.equal(maker))
    const targetBytes = hasTarget && target ? trim0x(target.toString()) : ''
    const dataBytes = data ? trim0x(data.toString()) : ''

    return {
      data: targetBytes + dataBytes,
      hasTarget,
    }
  }
}
