// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { trim0x } from '@1inch/byte-utils'
import type { IInstruction } from '../instructions'
import * as controls from '../instructions/controls'
import * as extruction from '../instructions/extruction'

export type ProgramLintWarningCode =
  | 'backward-jump'
  | 'misaligned-jump-target'
  | 'unreachable-instruction'

/**
 * Control-flow warning returned by `ProgramBuilder.lint()`
 **/
export type ProgramLintWarning = {
  code: ProgramLintWarningCode
  /**
   * Index of the instruction in `ProgramBuilder.getInstructions()`
   */
  instructionIndex: number
  message: string
}

const JUMP_OPCODE_IDS = new Set([
  controls.jump.id,
  controls.jumpIfTokenIn.id,
  controls.jumpIfTokenOut.id,
])

const CONDITIONAL_JUMP_OPCODE_IDS = new Set([controls.jumpIfTokenIn.id, controls.jumpIfTokenOut.id])

/**
 * Lints the control flow of `instructions` laid out as `ProgramBuilder.build()` encodes them:
 * `opcode (1 byte) | argsLength (1 byte) | args` per instruction, with jump targets being
 * absolute byte offsets into the program
 **/
export function lintProgram(instructions: IInstruction[]): ProgramLintWarning[] {
  const offsets: number[] = []
  let programLength = 0

  for (const ix of instructions) {
    offsets.push(programLength)
    programLength += 2 + trim0x(ix.opcode.argsCoder().encode(ix.args).toString()).length / 2
  }

  const indexByOffset = new Map(offsets.map((offset, index) => [offset, index]))
  const warnings: ProgramLintWarning[] = []
  const successors: number[][] = []

  instructions.forEach((ix, index) => {
    const fallthrough = index + 1

    if (!JUMP_OPCODE_IDS.has(ix.opcode.id)) {
      successors.push([fallthrough])

      return
    }

    const offset = offsets[index]
    const target = Number((ix.args as controls.JumpArgs | controls.JumpIfTokenArgs).nextPC)
    const targetIndex = indexByOffset.get(target)
    const name = formatInstruction(ix, index, offset)

    if (target <= offset) {
      warnings.push({
        code: 'backward-jump',
        instructionIndex: index,
        message: `${name} jumps back to offset ${target}, so execution can loop until it runs out of gas`,
      })
    }

    if (targetIndex === undefined && target !== programLength) {
      warnings.push({
        code: 'misaligned-jump-target',
        instructionIndex: index,
        message:
          target > programLength
            ? `${name} jumps to offset ${target}, past the program end (${programLength})`
            : `${name} jumps to offset ${target}, which is not an instruction start`,
      })
    }

    const jumpSuccessors = targetIndex === undefined ? [] : [targetIndex]

    successors.push(
      CONDITIONAL_JUMP_OPCODE_IDS.has(ix.opcode.id)
        ? [...jumpSuccessors, fallthrough]
        : jumpSuccessors,
    )
  })

  // extruction returns an arbitrary nextPC, so reachability cannot be derived statically
  if (!instructions.some((ix) => ix.opcode.id === extruction.extruction.id)) {
    const reachable = findReachable(successors)

    instructions.forEach((ix, index) => {
      if (!reachable.has(index)) {
        warnings.push({
          code: 'unreachable-instruction',
          instructionIndex: index,
          message: `${formatInstruction(ix, index, offsets[index])} is unreachable from the program start`,
        })
      }
    })
  }

  return warnings.sort((a, b) => a.instructionIndex - b.instructionIndex)
}

/**
 * Returns indexes of instructions reachable from the first one, where `successors[i]` lists the
 * instructions that can run right after instruction `i` (an index past the last instruction ends
 * the program)
 **/
function findReachable(successors: number[][]): Set<number> {
  const queue = successors.length ? [0] : []
  const reachable = new Set(queue)

  for (let i = 0; i < queue.length; i++) {
    for (const successor of successors[queue[i]]) {
      if (successor < successors.length && !reachable.has(successor)) {
        reachable.add(successor)
        queue.push(successor)
      }
    }
  }

  return reachable
}

function formatInstruction(ix: IInstruction, index: number, offset: number): string {
  return `Instruction ${index} (${ix.opcode.id.description ?? String(ix.opcode.id)}) at offset ${offset}`
}
