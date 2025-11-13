import { BytesBuilder, BytesIter, trim0x, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { SwapVmProgram } from './swap-vm-program'
import type { IArgsData, IInstruction, IOpcode } from '../instructions'
import { EMPTY_OPCODE } from '../instructions/empty'

/**
 * Abstract base class for building SwapVM programs
 **/
export class ProgramBuilder {
  protected program: IInstruction<IArgsData>[] = []

  public constructor(protected readonly ixsSet: IOpcode[]) {}

  /**
   * Decodes a SwapVM program into builder instructions
   **/
  public decode(program: SwapVmProgram): this {
    const iter = BytesIter.HexString(program.toString())

    while (!iter.isEmpty()) {
      const opcodeIdx = Number(iter.nextByte())
      const argsLength = Number(iter.nextByte())
      const argsHex = argsLength ? iter.nextBytes(argsLength) : '0x'

      if (opcodeIdx === 0) {
        throw new Error('Invalid opcode: 0 (NOT_INSTRUCTION)')
      }

      const opcode = this.ixsSet[opcodeIdx]

      if (!opcode) {
        throw new Error(`Opcode at index ${opcodeIdx} is missing`)
      }

      this.program.push(opcode.createIx(opcode.argsCoder().decode(new HexString(argsHex))))
    }

    return this
  }

  /**
   * Builds the SwapVM program bytecode from accumulated instructions
   **/
  public build(): SwapVmProgram {
    const builder = new BytesBuilder()

    for (const ix of this.program) {
      const { args, opcode } = ix
      const opcodeIdx = this.ixsSet.findIndex((o) => o.id === opcode.id)
      const coder = opcode.argsCoder()
      const encoded = coder.encode(args)

      const encodedBytes = trim0x(encoded.toString())

      builder.addByte(BigInt(opcodeIdx)).addByte(BigInt(encodedBytes.length / 2))

      if (encodedBytes.length) {
        builder.addBytes(add0x(encodedBytes))
      }
    }

    return new SwapVmProgram(builder.asHex())
  }

  /**
   * Returns the current list of instructions in the program
   **/
  public getInstructions(): Array<IInstruction> {
    return this.program
  }

  /**
   * Adds an instruction to the program with validation
   **/
  public add(ix: IInstruction): this {
    const opcodeId = this.ixsSet.findIndex((o) => o.id === ix.opcode.id)

    if (opcodeId === -1) {
      const opcodes = this.ixsSet
        .map((i) => String(i.id))
        .filter((s) => s !== EMPTY_OPCODE.toString())
        .join(', ')

      throw new Error(`Invalid opcode ${String(ix.opcode.id)}: Supported opcodes: ${opcodes}`)
    }

    this.program.push(ix)

    return this
  }
}
