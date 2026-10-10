// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, AddressHalf, HexString } from '@1inch/sdk-core'
import type { DataFor } from '@1inch/sdk-core'
import { AquaProgramBuilder } from './aqua-program-builder'
import { ProgramBuilder } from './program-builder'
import { RegularProgramBuilder } from './regular-program-builder'
import type { SwapVmProgram } from './swap-vm-program'
import * as controls from '../instructions/controls'
import { EMPTY_OPCODE } from '../instructions/empty'
import * as extruction from '../instructions/extruction'
import { Opcode } from '../instructions/opcode'
import * as xycSwap from '../instructions/xyc-swap'
import { AquaPeggedAmmStrategy, AquaXYCAmmStrategy } from '../strategies'

type Builder = RegularProgramBuilder | AquaProgramBuilder

const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const DAI = new Address('0x6B175474E89094C44Da98b954EedeAC495271d0F')
const RECEIVER = new Address('0x0000000000000000000000000000000000000002')

const JUMP_SIZE = 4n
const SWAP_SIZE = 2n
const FEE_SIZE = 6n

const jumpIfToken = (nextPC: bigint): DataFor<controls.JumpIfTokenArgs> => ({
  tokenTail: AddressHalf.fromAddress(USDC),
  nextPC,
})

function instructionStarts(program: SwapVmProgram): bigint[] {
  const bytes = Buffer.from(program.toString().slice(2), 'hex')
  const starts: bigint[] = []

  for (let offset = 0; offset < bytes.length; offset += 2 + bytes[offset + 1]) {
    starts.push(BigInt(offset))
  }

  return starts
}

describe.each<[string, () => Builder]>([
  ['RegularProgramBuilder', (): Builder => new RegularProgramBuilder()],
  ['AquaProgramBuilder', (): Builder => new AquaProgramBuilder()],
])('ProgramBuilder.lint with %s', (_, createBuilder) => {
  const JUMP_IF_TOKEN_SIZE = BigInt(
    createBuilder().jumpIfTokenIn(jumpIfToken(0n)).build().bytesCount(),
  )

  it('should return no warnings for an empty program', () => {
    expect(createBuilder().lint()).toEqual([])
  })

  it('should return no warnings for a program without jumps', () => {
    const builder = createBuilder()
      .deadline({ deadline: 1735689600n })
      .flatFeeAmountInXD({ fee: 1000n })
      .xycSwapXD()

    expect(builder.lint()).toEqual([])
  })

  it('should follow both the target and the fallthrough of a conditional jump', () => {
    const thenStart = JUMP_IF_TOKEN_SIZE + FEE_SIZE + JUMP_SIZE
    const builder = createBuilder()
      .jumpIfTokenIn(jumpIfToken(thenStart))
      .flatFeeAmountInXD({ fee: 1000n })
      .jump({ nextPC: thenStart + FEE_SIZE })
      .flatFeeAmountInXD({ fee: 2000n })
      .xycSwapXD()

    expect(builder.lint()).toEqual([])
  })

  it('should flag instructions skipped by an unconditional jump', () => {
    const target = JUMP_SIZE + FEE_SIZE + JUMP_SIZE
    const builder = createBuilder()
      .jump({ nextPC: target })
      .flatFeeAmountInXD({ fee: 1000n })
      .jump({ nextPC: target + FEE_SIZE })
      .flatFeeAmountInXD({ fee: 2000n })
      .xycSwapXD()

    expect(builder.lint()).toMatchObject([
      { code: 'unreachable-instruction', instructionIndex: 1 },
      { code: 'unreachable-instruction', instructionIndex: 2 },
    ])
  })

  it('should accept jumps to the program end', () => {
    const conditional = createBuilder()
      .jumpIfTokenOut(jumpIfToken(JUMP_IF_TOKEN_SIZE + SWAP_SIZE))
      .xycSwapXD()
    const trailing = createBuilder()
      .xycSwapXD()
      .jump({ nextPC: SWAP_SIZE + JUMP_SIZE })

    expect(conditional.lint()).toEqual([])
    expect(trailing.lint()).toEqual([])
  })

  it('should flag instructions after an unconditional jump to the program end', () => {
    const builder = createBuilder()
      .jump({ nextPC: JUMP_SIZE + FEE_SIZE + SWAP_SIZE })
      .flatFeeAmountInXD({ fee: 1000n })
      .xycSwapXD()

    expect(builder.lint()).toMatchObject([
      { code: 'unreachable-instruction', instructionIndex: 1 },
      { code: 'unreachable-instruction', instructionIndex: 2 },
    ])
  })

  it('should flag a backward jump that loops', () => {
    const builder = createBuilder().xycSwapXD().jump({ nextPC: 0n })

    expect(builder.lint()).toMatchObject([{ code: 'backward-jump', instructionIndex: 1 }])
  })

  it('should flag a jump to itself and the instructions after it', () => {
    const builder = createBuilder().jump({ nextPC: 0n }).xycSwapXD()

    expect(builder.lint()).toMatchObject([
      { code: 'backward-jump', instructionIndex: 0 },
      { code: 'unreachable-instruction', instructionIndex: 1 },
    ])
  })

  it('should flag a backward conditional jump', () => {
    const builder = createBuilder()
      .xycSwapXD()
      .jumpIfTokenIn(jumpIfToken(0n))
      .flatFeeAmountInXD({ fee: 1000n })

    expect(builder.lint()).toMatchObject([{ code: 'backward-jump', instructionIndex: 1 }])
  })

  it('should flag a jump past the program end and the instructions it skips', () => {
    const builder = createBuilder()
      .jump({ nextPC: 100n })
      .flatFeeAmountInXD({ fee: 1000n })
      .xycSwapXD()

    expect(builder.lint()).toMatchObject([
      { code: 'misaligned-jump-target', instructionIndex: 0 },
      { code: 'unreachable-instruction', instructionIndex: 1 },
      { code: 'unreachable-instruction', instructionIndex: 2 },
    ])
  })

  it('should not follow a jump into the middle of an instruction', () => {
    const unconditional = createBuilder()
      .jump({ nextPC: JUMP_SIZE + 1n })
      .flatFeeAmountInXD({ fee: 1000n })
      .xycSwapXD()
    const conditional = createBuilder()
      .jumpIfTokenIn(jumpIfToken(JUMP_IF_TOKEN_SIZE + 1n))
      .flatFeeAmountInXD({ fee: 1000n })
      .xycSwapXD()

    expect(unconditional.lint()).toMatchObject([
      { code: 'misaligned-jump-target', instructionIndex: 0 },
      { code: 'unreachable-instruction', instructionIndex: 1 },
      { code: 'unreachable-instruction', instructionIndex: 2 },
    ])
    expect(conditional.lint()).toMatchObject([
      { code: 'misaligned-jump-target', instructionIndex: 0 },
    ])
  })

  it('should describe each warning and order them by instruction', () => {
    const builder = createBuilder()
      .jump({ nextPC: 100n })
      .xycSwapXD()
      .jump({ nextPC: JUMP_SIZE + 1n })

    expect(builder.lint()).toEqual([
      {
        code: 'misaligned-jump-target',
        instructionIndex: 0,
        message:
          'Instruction 0 (Controls.jump) at offset 0 jumps to offset 100, past the program end (10)',
      },
      {
        code: 'unreachable-instruction',
        instructionIndex: 1,
        message:
          'Instruction 1 (XYCSwap.xycSwapXD) at offset 4 is unreachable from the program start',
      },
      {
        code: 'backward-jump',
        instructionIndex: 2,
        message:
          'Instruction 2 (Controls.jump) at offset 6 jumps back to offset 5, so execution can loop until it runs out of gas',
      },
      {
        code: 'misaligned-jump-target',
        instructionIndex: 2,
        message:
          'Instruction 2 (Controls.jump) at offset 6 jumps to offset 5, which is not an instruction start',
      },
      {
        code: 'unreachable-instruction',
        instructionIndex: 2,
        message: 'Instruction 2 (Controls.jump) at offset 6 is unreachable from the program start',
      },
    ])
  })

  it('should compute offsets matching the bytecode produced by build()', () => {
    const create = (target: bigint, end: bigint): Builder =>
      createBuilder()
        .jumpIfTokenIn(jumpIfToken(target))
        .deadline({ deadline: 1735689600n })
        .jumpIfTokenOut(jumpIfToken(end))
        .flatFeeAmountInXD({ fee: 1000n })
        .decayXD({ decayPeriod: 60n })
        .xycSwapXD()

    const program = create(0n, 0n).build()
    const end = BigInt(program.bytesCount())
    const starts = instructionStarts(program)

    expect(starts).toHaveLength(6)

    for (const target of [...starts.slice(1), end]) {
      expect(create(target, end).lint()).toEqual([])
      expect(create(target + 1n, end).lint()).toMatchObject([
        { code: 'misaligned-jump-target', instructionIndex: 0 },
      ])
    }
  })

  it('should still flag jumps but skip reachability for programs with an extruction', () => {
    const extructionIx = extruction.extruction.createIx(
      new extruction.ExtructionArgs(RECEIVER, new HexString('0x1234')),
    )
    const withoutExtruction = createBuilder()
      .jump({ nextPC: 100n })
      .xycSwapXD()
      .jump({ nextPC: 0n })
    const withExtruction = createBuilder()
      .jump({ nextPC: 100n })
      .add(extructionIx)
      .xycSwapXD()
      .jump({ nextPC: 0n })

    expect(withoutExtruction.lint()).toMatchObject([
      { code: 'misaligned-jump-target', instructionIndex: 0 },
      { code: 'unreachable-instruction', instructionIndex: 1 },
      { code: 'backward-jump', instructionIndex: 2 },
      { code: 'unreachable-instruction', instructionIndex: 2 },
    ])
    expect(withExtruction.lint()).toMatchObject([
      { code: 'misaligned-jump-target', instructionIndex: 0 },
      { code: 'backward-jump', instructionIndex: 3 },
    ])
  })

  it('should leave the program and build() untouched', () => {
    const builder = createBuilder().xycSwapXD().jump({ nextPC: 0n })
    const program = builder.build()

    expect(builder.lint()).toHaveLength(1)
    expect(builder.getInstructions()).toHaveLength(2)
    expect(builder.build()).toEqual(program)
  })
})

describe('ProgramBuilder.lint', () => {
  it.each<[string, SwapVmProgram]>([
    [
      'AquaXYCAmmStrategy',
      AquaXYCAmmStrategy.newConcentrate({ sqrtPriceMin: 100000n, sqrtPriceMax: 200000n })
        .withTxOriginAccessToken(DAI)
        .withProtocolFee(0.1, RECEIVER)
        .withDecayPeriod(3600n)
        .withFeeTokenIn(0.5)
        .build(),
    ],
    [
      'AquaPeggedAmmStrategy',
      AquaPeggedAmmStrategy.new({
        tokenA: { address: USDC, decimals: 6, reserve: 1_000_000n * 10n ** 6n },
        tokenB: { address: DAI, decimals: 18, reserve: 1_000_000n * 10n ** 18n },
        linearWidth: 8n * 10n ** 26n,
      })
        .withFeeTokenIn(1)
        .build(),
    ],
  ])('should return no warnings for decoded %s programs', (_, program) => {
    expect(AquaProgramBuilder.decode(program).lint()).toEqual([])
  })

  it('should recognize jumps of a custom instruction set by opcode, not by index', () => {
    const builder = new ProgramBuilder([EMPTY_OPCODE, xycSwap.xycSwapXD, controls.jump])
      .add(xycSwap.xycSwapXD.createIx(new xycSwap.XycSwapXDArgs()))
      .add(controls.jump.createIx(new controls.JumpArgs(0n)))

    expect(builder.build().toString()).toBe('0x010002020000')
    expect(builder.lint()).toMatchObject([{ code: 'backward-jump', instructionIndex: 1 }])
  })

  it('should name custom opcodes without a symbol description', () => {
    const anonymous = new Opcode(Symbol(), xycSwap.XycSwapXDArgs.CODER)
    const builder = new ProgramBuilder([EMPTY_OPCODE, controls.jump, anonymous])
      .add(controls.jump.createIx(new controls.JumpArgs(JUMP_SIZE + SWAP_SIZE)))
      .add(anonymous.createIx(new xycSwap.XycSwapXDArgs()))

    expect(builder.lint()).toEqual([
      {
        code: 'unreachable-instruction',
        instructionIndex: 1,
        message: 'Instruction 1 (Symbol()) at offset 4 is unreachable from the program start',
      },
    ])
  })
})
