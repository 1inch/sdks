// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BytesBuilder, BytesIter, trim0x, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import assert from 'assert'
import { SwapVmProgram } from './swap-vm-program'
import type { IArgsData, IInstruction, IOpcode } from '../instructions'
import { EMPTY_OPCODE } from '../instructions/empty'

const isEmptyOpcode = (opcode: IOpcode): boolean => opcode.id === EMPTY_OPCODE.id

/**
 * Abstract base class for building SwapVM programs
 **/
export class ProgramBuilder {
  protected program: IInstruction<IArgsData>[] = []

  public constructor(protected readonly ixsSet: IOpcode[]) {}

  /**
   * Decodes a SwapVM program into builder instructions
   *
   * Opcode bytes are resolved against this builder's opcode table, so the same bytes can decode to
   * different instructions under different tables (e.g. byte 0x16 is `xycSwapXD` in the regular
   * table but a reserved slot in the Aqua table). Always decode a program with the opcode table of
   * the router it targets, e.g. `AquaProgramBuilder` for `AquaSwapVMRouter` programs.
   *
   * Throws if an opcode byte is outside the table or maps to a reserved `EMPTY_OPCODE` slot, or if
   * the decoded args of an instruction do not re-encode to exactly the original args bytes.
   * Instructions are appended only if the whole program decodes successfully.
   **/
  public decode(program: SwapVmProgram): this {
    const iter = BytesIter.HexString(program.toString())
    const instructions: IInstruction<IArgsData>[] = []
    let offset = 0

    while (!iter.isEmpty()) {
      const opcodeIdx = Number(iter.nextByte())
      const argsLength = Number(iter.nextByte())
      const argsHex = argsLength ? iter.nextBytes(argsLength) : '0x'
      const opcode = this.ixsSet[opcodeIdx]

      if (!opcode) {
        throw new Error(`Opcode at index ${opcodeIdx} is missing (instruction at offset ${offset})`)
      }

      if (isEmptyOpcode(opcode)) {
        throw new Error(
          `Invalid opcode: ${opcodeIdx} (NOT_INSTRUCTION) at offset ${offset}: reserved slot in this opcode table`,
        )
      }

      const coder = opcode.argsCoder()
      const args = coder.decode(new HexString(argsHex))
      const encodedArgs = coder.encode(args).toString()

      if (trim0x(encodedArgs).toLowerCase() !== trim0x(argsHex).toLowerCase()) {
        throw new Error(
          `Non-canonical args for opcode ${opcodeIdx} (${String(opcode.id)}) at offset ${offset}: ` +
            `${argsHex} re-encodes as ${encodedArgs}`,
        )
      }

      instructions.push(opcode.createIx(args))
      offset += 2 + argsLength
    }

    this.program.push(...instructions)

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

      assert(
        opcodeIdx !== -1 && !isEmptyOpcode(opcode),
        `Opcode ${String(opcode.id)} does not map to an instruction slot of this opcode table`,
      )

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
    if (isEmptyOpcode(ix.opcode)) {
      throw new Error(
        `Invalid opcode ${String(ix.opcode.id)}: EMPTY_OPCODE marks a reserved slot and is not an instruction`,
      )
    }

    const opcodeId = this.ixsSet.findIndex((o) => o.id === ix.opcode.id)

    if (opcodeId === -1) {
      const opcodes = this.ixsSet
        .filter((o) => !isEmptyOpcode(o))
        .map((o) => String(o.id))
        .join(', ')

      throw new Error(`Invalid opcode ${String(ix.opcode.id)}: Supported opcodes: ${opcodes}`)
    }

    this.program.push(ix)

    return this
  }
}
