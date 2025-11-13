import type { IArgsData, IInstruction, IOpcode } from './types'

export class Instruction<T extends IArgsData> implements IInstruction<T> {
  constructor(
    public readonly opcode: IOpcode<T>,
    public readonly args: T,
  ) {}

  toJSON(): Record<string | number, unknown> {
    return {
      opcode: this.opcode.id.toString(),
      args: this.args.toJSON(),
    }
  }
}
