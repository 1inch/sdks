// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { BytesBuilder, BytesIter, trim0x, add0x } from '@1inch/byte-utils'
import { HexString } from '@1inch/sdk-core'
import { SwapVmProgram } from './swap-vm-program'
import { lintProgram } from './program-lint'
import type { ProgramLintWarning } from './program-lint'
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
   * Reports control-flow issues of the program as warnings, without throwing.
   *
   * Builders do not validate control flow: on-chain execution is bounded only by gas, and making
   * a program terminate is up to the maker. Offsets are computed exactly as {@link build} lays out
   * the bytecode (`opcode | argsLength | args`), and `jump`, `jumpIfTokenIn` and `jumpIfTokenOut`
   * targets are absolute byte offsets into it:
   * - `backward-jump` - the target is at or before the jump itself, so execution can loop until
   *   the transaction runs out of gas
   * - `misaligned-jump-target` - the target is neither an instruction start nor the program end
   *   (targets past the end included)
   * - `unreachable-instruction` - no execution path from offset 0 reaches the instruction, with
   *   conditional jumps followed both ways; not reported for programs containing `extruction`,
   *   which can continue at any offset
   *
   * To lint an existing program, decode it first, e.g. `AquaProgramBuilder.decode(program).lint()`
   *
   * @returns warnings ordered by `instructionIndex`, empty if no issue is found
   **/
  public lint(): ProgramLintWarning[] {
    return lintProgram(this.program)
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
