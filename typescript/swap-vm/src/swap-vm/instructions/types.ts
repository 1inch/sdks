// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString } from '@1inch/sdk-core'

export interface IArgsCoder<T> {
  decode(data: HexString): T
  encode(data: T): HexString
}

export interface IArgsData {
  toJSON(): Record<string | number, unknown> | null
}

export interface IOpcode<T extends IArgsData = IArgsData> {
  id: symbol
  argsCoder(): IArgsCoder<T>
  createIx(args: T): IInstruction<T>
}

export interface IInstruction<T extends IArgsData = IArgsData> {
  args: T
  opcode: IOpcode<T>
  toJSON(): Record<string | number, unknown>
}
