// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { DataFor } from '@1inch/sdk-core'
import { ProgramBuilder } from './program-builder'
import type { SwapVmProgram } from './swap-vm-program'
import { aquaInstructions } from '../instructions'
import * as controls from '../instructions/controls'
import * as xycSwap from '../instructions/xyc-swap'
import * as concentrate from '../instructions/concentrate'
import * as decay from '../instructions/decay'
import * as fee from '../instructions/fee'
import * as debug from '../instructions/debug/opcodes'
import * as peggedSwap from '../instructions/pegged-swap'

export class AquaProgramBuilder extends ProgramBuilder {
  constructor() {
    super([...aquaInstructions])
  }

  static decode(program: SwapVmProgram): AquaProgramBuilder {
    return new AquaProgramBuilder().decode(program)
  }

  /**
   * Enables debug mode for the program
   * WARNING: Debug instructions will throw an error if debug mode is not enabled
   */
  public withDebug(): this {
    this.ixsSet[0] = debug.printSwapRegisters
    this.ixsSet[1] = debug.printSwapQuery
    this.ixsSet[2] = debug.printContext
    this.ixsSet[3] = debug.printAmountForSwap
    this.ixsSet[4] = debug.printFreeMemoryPointer
    this.ixsSet[5] = debug.printGasLeft

    return this
  }

  /**
   * Unconditional jump to specified program counter
   **/
  public jump(data: DataFor<controls.JumpArgs>): this {
    super.add(controls.jump.createIx(new controls.JumpArgs(data.nextPC)))

    return this
  }

  /**
   * Jumps if tokenIn is the specified token
   **/
  public jumpIfTokenIn(data: DataFor<controls.JumpIfTokenArgs>): this {
    super.add(
      controls.jumpIfTokenIn.createIx(new controls.JumpIfTokenArgs(data.tokenTail, data.nextPC)),
    )

    return this
  }

  /**
   * Jumps if tokenOut is the specified token
   **/
  public jumpIfTokenOut(data: DataFor<controls.JumpIfTokenArgs>): this {
    super.add(
      controls.jumpIfTokenOut.createIx(new controls.JumpIfTokenArgs(data.tokenTail, data.nextPC)),
    )

    return this
  }

  /**
   * Reverts if the deadline has been reached
   **/
  public deadline(data: DataFor<controls.DeadlineArgs>): this {
    super.add(controls.deadline.createIx(new controls.DeadlineArgs(data.deadline)))

    return this
  }

  /**
   * Requires taker to hold any amount of specified token (supports NFTs)
   **/
  public onlyTakerTokenBalanceNonZero(
    data: DataFor<controls.OnlyTakerTokenBalanceNonZeroArgs>,
  ): this {
    super.add(
      controls.onlyTakerTokenBalanceNonZero.createIx(
        new controls.OnlyTakerTokenBalanceNonZeroArgs(data.token),
      ),
    )

    return this
  }

  /**
   * Requires taker to hold at least specified amount of token
   **/
  public onlyTakerTokenBalanceGte(data: DataFor<controls.OnlyTakerTokenBalanceGteArgs>): this {
    super.add(
      controls.onlyTakerTokenBalanceGte.createIx(
        new controls.OnlyTakerTokenBalanceGteArgs(data.token, data.minAmount),
      ),
    )

    return this
  }

  /**
   * Requires taker to hold at least specified share of token's total supply
   **/
  public onlyTakerTokenSupplyShareGte(
    data: DataFor<controls.OnlyTakerTokenSupplyShareGteArgs>,
  ): this {
    super.add(
      controls.onlyTakerTokenSupplyShareGte.createIx(
        new controls.OnlyTakerTokenSupplyShareGteArgs(data.token, data.minShareE18),
      ),
    )

    return this
  }

  /**
   * No-op instruction used to add uniqueness to order hashes (prevents replay attacks)
   **/
  public salt(data: DataFor<controls.SaltArgs>): this {
    super.add(controls.salt.createIx(new controls.SaltArgs(data.salt)))

    return this
  }

  /**
   * Basic swap using constant product formula (x*y=k)
   **/
  public xycSwapXD(): this {
    super.add(xycSwap.xycSwapXD.createIx(new xycSwap.XycSwapXDArgs()))

    return this
  }

  /**
   * Concentrates liquidity within price bounds for two tokens
   **/
  public concentrateGrowLiquidity2D(
    data: DataFor<concentrate.ConcentrateGrowLiquidity2DArgs>,
  ): this {
    super.add(
      concentrate.concentrateGrowLiquidity2D.createIx(
        new concentrate.ConcentrateGrowLiquidity2DArgs(data.sqrtPriceMin, data.sqrtPriceMax),
      ),
    )

    return this
  }

  /**
   * Square-root linear swap curve for pegged assets
   **/
  public peggedSwapGrowPriceRange2D(data: DataFor<peggedSwap.PeggedSwapArgs>): this {
    super.add(
      peggedSwap.peggedSwapGrowPriceRange2D.createIx(
        new peggedSwap.PeggedSwapArgs(data.x0, data.y0, data.linearWidth, data.rateLt, data.rateGt),
      ),
    )

    return this
  }

  /**
   * Applies time-based decay to balance adjustments
   **/
  public decayXD(data: DataFor<decay.DecayXDArgs>): this {
    super.add(decay.decayXD.createIx(new decay.DecayXDArgs(data.decayPeriod)))

    return this
  }

  /**
   * Applies fee to amountIn
   **/
  public flatFeeAmountInXD(data: DataFor<fee.FlatFeeArgs>): this {
    super.add(fee.flatFeeAmountInXD.createIx(new fee.FlatFeeArgs(data.fee)))

    return this
  }

  /**
   * Applies protocol fee to amountIn with direct transfer
   **/
  public protocolFeeAmountInXD(data: DataFor<fee.ProtocolFeeArgs>): this {
    super.add(fee.protocolFeeAmountInXD.createIx(new fee.ProtocolFeeArgs(data.fee, data.to)))

    return this
  }

  /**
   * Applies protocol fee to amountIn through Aqua protocol
   **/
  public aquaProtocolFeeAmountInXD(data: DataFor<fee.ProtocolFeeArgs>): this {
    super.add(fee.aquaProtocolFeeAmountInXD.createIx(new fee.ProtocolFeeArgs(data.fee, data.to)))

    return this
  }

  /**
   * Applies protocol fee, fetched from external contract, to amountIn with direct transfer
   **/
  public dynamicProtocolFeeAmountInXD(data: DataFor<fee.DynamicProtocolFeeArgs>): this {
    super.add(
      fee.dynamicProtocolFeeAmountInXD.createIx(new fee.DynamicProtocolFeeArgs(data.feeProvider)),
    )

    return this
  }

  /**
   * Applies protocol fee, fetched from external contract, to amountIn through Aqua protocol
   **/
  public aquaDynamicProtocolFeeAmountInXD(data: DataFor<fee.DynamicProtocolFeeArgs>): this {
    super.add(
      fee.aquaDynamicProtocolFeeAmountInXD.createIx(
        new fee.DynamicProtocolFeeArgs(data.feeProvider),
      ),
    )

    return this
  }

  /**
   * DEBUG: Prints current swap registers (amounts and tokens)
   * WARNING: Requires withDebug() to be called first, otherwise will throw an error
   */
  public debugPrintSwapRegisters(): this {
    super.add(debug.printSwapRegisters.createIx(new debug.PrintSwapRegistersArgs()))

    return this
  }

  /**
   * DEBUG: Prints current swap query state
   * WARNING: Requires withDebug() to be called first, otherwise will throw an error
   */
  public debugPrintSwapQuery(): this {
    super.add(debug.printSwapQuery.createIx(new debug.PrintSwapQueryArgs()))

    return this
  }

  /**
   * DEBUG: Prints execution context information
   * WARNING: Requires withDebug() to be called first, otherwise will throw an error
   */
  public debugPrintContext(): this {
    super.add(debug.printContext.createIx(new debug.PrintContextArgs()))

    return this
  }

  /**
   * DEBUG: Prints calculated amount for swap
   * WARNING: Requires withDebug() to be called first, otherwise will throw an error
   */
  public debugPrintAmountForSwap(): this {
    super.add(debug.printAmountForSwap.createIx(new debug.PrintAmountForSwapArgs()))

    return this
  }

  /**
   * DEBUG: Prints current free memory pointer value
   * WARNING: Requires withDebug() to be called first, otherwise will throw an error
   */
  public debugPrintFreeMemoryPointer(): this {
    super.add(debug.printFreeMemoryPointer.createIx(new debug.PrintFreeMemoryPointerArgs()))

    return this
  }

  /**
   * DEBUG: Prints remaining gas
   * WARNING: Requires withDebug() to be called first, otherwise will throw an error
   */
  public debugPrintGasLeft(): this {
    super.add(debug.printGasLeft.createIx(new debug.PrintGasLeftArgs()))

    return this
  }
}
