// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

/**
 * Differential test: the pinned SwapVM contract is the single source of truth for the
 * concentrated-liquidity math. Every SDK helper in `concentrate-liquidity-math.ts` must
 * reproduce `XYCConcentrateArgsBuilder` (XYCConcentrate.sol) to the wei — the SDK sizes the
 * reserves makers actually ship, and any rounding drift opens pools away from the target spot.
 *
 * Runs against a local Anvil with no mainnet fork: the harness is pure math, so this suite
 * needs Docker but no FORK_URL.
 */
import type { StartedTestContainer } from 'testcontainers'
import { GenericContainer } from 'testcontainers'
import { LogWaitStrategy } from 'testcontainers/build/wait-strategies/log-wait-strategy'
import type { Hex, PublicActions, WalletClient } from 'viem'
import { createWalletClient, http, publicActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { expect } from 'vitest'
import TestXYCConcentrate from '@contracts/TestXYCConcentrate.sol/TestXYCConcentrate.json'
import {
  computeBalances,
  computeLiquidityAndPrice,
  computeLiquidityFromAmounts,
} from '../src/swap-vm/instructions/concentrate'
import { bigintSqrt } from '../src/swap-vm/instructions/utils/bigint-sqrt'

const ONE = 10n ** 18n

const TEST_ABI = TestXYCConcentrate.abi

type SqrtPrices = { sqrtPspot: bigint; sqrtPmin: bigint; sqrtPmax: bigint }

/** Price regimes as sqrt(P) in 1e18 fixed-point. */
const REGIMES: Record<string, SqrtPrices> = {
  // sqrtP ~ 1e18: same-decimals pair around parity
  parity: { sqrtPspot: ONE, sqrtPmin: 9n * 10n ** 17n, sqrtPmax: 11n * 10n ** 17n },
  wide: { sqrtPspot: ONE, sqrtPmin: 8n * 10n ** 17n, sqrtPmax: 12n * 10n ** 17n },
  // sqrtP ~ 2e22: USDC (6dp) / WETH (18dp) at 2500 USDC per WETH, 2000-3000 range
  usdcWeth: {
    sqrtPspot: bigintSqrt((10n ** 36n * ONE) / (2500n * 10n ** 6n)),
    sqrtPmin: bigintSqrt((10n ** 36n * ONE) / (3000n * 10n ** 6n)),
    sqrtPmax: bigintSqrt((10n ** 36n * ONE) / (2000n * 10n ** 6n)),
  },
  // sqrtP ~ 1.18e9: cheap 18-decimal token0 at 1.4e-6 of a 6-decimal token1 (audit repro regime).
  // sqrtPmax * sqrtPspot ~ 1.7e18: the stale product form truncates its denominator to 1 wei.
  cheapToken0: {
    sqrtPspot: bigintSqrt(14n * 10n ** 17n),
    sqrtPmin: bigintSqrt(112n * 10n ** 16n),
    sqrtPmax: bigintSqrt(168n * 10n ** 16n),
  },
  // sqrtPmax * sqrtPspot < ONE: the stale product form reverts with division-by-zero here.
  subOneProduct: { sqrtPspot: 500_000_000n, sqrtPmin: 400_000_000n, sqrtPmax: 600_000_000n },
}

const LIQUIDITIES: Record<string, bigint> = {
  wei: 1n,
  small: 1_000n * ONE,
  large: 10n ** 24n,
  huge: 10n ** 30n,
}

describe('concentrate-liquidity-math vs pinned XYCConcentrateArgsBuilder', () => {
  let container: StartedTestContainer
  let harness: Hex
  let client: ReturnType<typeof makeClient>

  function makeClient(url: string): WalletClient & PublicActions {
    const account = privateKeyToAccount(
      '0x37d5819e14a620d31d0ba9aab2b5154aa000c5519ae602158ddbe6369dca91fb',
    )

    return createWalletClient({
      account,
      transport: http(url),
      chain: { ...mainnet, id: 31337 },
    }).extend(publicActions)
  }

  beforeAll(async () => {
    container = await new GenericContainer('ghcr.io/foundry-rs/foundry:v1.2.3')
      .withExposedPorts(8545)
      .withCommand([
        `anvil --chain-id 31337 --mnemonic 'hat hat horse border print cancel subway heavy copy alert eternal mask' --host 0.0.0.0`,
      ])
      .withWaitStrategy(new LogWaitStrategy('Listening on 0.0.0.0:8545', 1))
      .withName(`anvil_concentrate_math_${Math.random()}`)
      .start()

    client = makeClient(`http://127.0.0.1:${container.getMappedPort(8545)}`)

    const txHash = await client.deployContract({
      abi: TEST_ABI,
      bytecode: TestXYCConcentrate.bytecode.object as Hex,
      args: [],
    })
    const receipt = await client.waitForTransactionReceipt({ hash: txHash })
    harness = receipt.contractAddress as Hex
  }, 120_000)

  afterAll(async () => {
    await container?.stop()
  })

  const contractBalances = (targetL: bigint, p: SqrtPrices): Promise<readonly [bigint, bigint]> =>
    client.readContract({
      address: harness,
      abi: TEST_ABI,
      functionName: 'computeBalances',
      args: [targetL, p.sqrtPspot, p.sqrtPmin, p.sqrtPmax],
    })

  const contractLiquidityFromAmounts = (
    availableLt: bigint,
    availableGt: bigint,
    p: SqrtPrices,
  ): Promise<readonly [bigint, bigint, bigint]> =>
    client.readContract({
      address: harness,
      abi: TEST_ABI,
      functionName: 'computeLiquidityFromAmounts',
      args: [availableLt, availableGt, p.sqrtPspot, p.sqrtPmin, p.sqrtPmax],
    })

  const contractLiquidityAndPrice = (
    balanceLt: bigint,
    balanceGt: bigint,
    sqrtPriceMin: bigint,
    sqrtPriceMax: bigint,
  ): Promise<readonly [bigint, bigint]> =>
    client.readContract({
      address: harness,
      abi: TEST_ABI,
      functionName: 'computeLiquidityAndPrice',
      args: [balanceLt, balanceGt, sqrtPriceMin, sqrtPriceMax],
    })

  describe('computeBalances', () => {
    for (const [regimeName, prices] of Object.entries(REGIMES)) {
      for (const [liqName, targetL] of Object.entries(LIQUIDITIES)) {
        it(`matches the contract to the wei (${regimeName}, L=${liqName})`, async () => {
          const sdk = computeBalances(targetL, prices.sqrtPspot, prices.sqrtPmin, prices.sqrtPmax)
          const [bLt, bGt] = await contractBalances(targetL, prices)

          expect(sdk.bLt).toBe(bLt)
          expect(sdk.bGt).toBe(bGt)
        })
      }
    }

    it('matches the contract on the boundary spots (spot == min, spot == max)', async () => {
      const targetL = 1_000n * ONE

      for (const regime of Object.values(REGIMES)) {
        for (const sqrtPspot of [regime.sqrtPmin, regime.sqrtPmax]) {
          const sdk = computeBalances(targetL, sqrtPspot, regime.sqrtPmin, regime.sqrtPmax)
          const [bLt, bGt] = await contractBalances(targetL, {
            ...regime,
            sqrtPspot,
          })

          expect(sdk.bLt).toBe(bLt)
          expect(sdk.bGt).toBe(bGt)
        }
      }
    })
  })

  describe('computeLiquidityFromAmounts', () => {
    // UINT_256_MAX is the SDK's off-chain "unlimited" sentinel; on-chain Math.mulDiv overflows
    // on it (panic 0x11), so the differential check uses the largest practical stand-in instead.
    const AMOUNTS: Record<string, { availableLt: bigint; availableGt: bigint }> = {
      ltLimiting: { availableLt: 100n * ONE, availableGt: 1_000_000n * ONE },
      gtLimiting: { availableLt: 10_000n * ONE, availableGt: 25n * ONE },
      balanced: { availableLt: 200n * ONE, availableGt: 300n * ONE },
      maxUint: { availableLt: 10n ** 40n, availableGt: 400n * ONE },
    }

    for (const [regimeName, prices] of Object.entries(REGIMES)) {
      for (const [amountsName, amounts] of Object.entries(AMOUNTS)) {
        it(`matches the contract to the wei (${regimeName}, ${amountsName})`, async () => {
          const sdk = computeLiquidityFromAmounts(
            amounts.availableLt,
            amounts.availableGt,
            prices.sqrtPspot,
            prices.sqrtPmin,
            prices.sqrtPmax,
          )
          const [targetL, actualLt, actualGt] = await contractLiquidityFromAmounts(
            amounts.availableLt,
            amounts.availableGt,
            prices,
          )

          expect(sdk.targetL).toBe(targetL)
          expect(sdk.actualLt).toBe(actualLt)
          expect(sdk.actualGt).toBe(actualGt)
        })
      }
    }
  })

  describe('computeLiquidityAndPrice', () => {
    it('matches the contract for the documented reserve vectors', async () => {
      const vectors = [
        {
          balanceLt: 1000n * ONE,
          balanceGt: 500n * ONE,
          min: 9n * 10n ** 17n,
          max: 11n * 10n ** 17n,
        },
        {
          balanceLt: 100n * ONE,
          balanceGt: 100n * ONE,
          min: 95n * 10n ** 16n,
          max: 105n * 10n ** 16n,
        },
      ]

      for (const v of vectors) {
        const sdk = computeLiquidityAndPrice(v.balanceLt, v.balanceGt, v.min, v.max)
        const [liquidity, sqrtPriceSpot] = await contractLiquidityAndPrice(
          v.balanceLt,
          v.balanceGt,
          v.min,
          v.max,
        )

        expect(sdk.liquidity).toBe(liquidity)
        expect(sdk.sqrtPriceSpot).toBe(sqrtPriceSpot)
      }
    })

    it('matches the contract on balances produced by computeBalances across regimes', async () => {
      for (const prices of Object.values(REGIMES)) {
        const { bLt, bGt } = computeBalances(
          LIQUIDITIES.large,
          prices.sqrtPspot,
          prices.sqrtPmin,
          prices.sqrtPmax,
        )
        const sdk = computeLiquidityAndPrice(bLt, bGt, prices.sqrtPmin, prices.sqrtPmax)
        const [liquidity, sqrtPriceSpot] = await contractLiquidityAndPrice(
          bLt,
          bGt,
          prices.sqrtPmin,
          prices.sqrtPmax,
        )

        expect(sdk.liquidity).toBe(liquidity)
        expect(sdk.sqrtPriceSpot).toBe(sqrtPriceSpot)
      }
    })
  })

  describe('round-trip: reserves computed for a target spot re-derive that spot', () => {
    for (const [regimeName, prices] of Object.entries(REGIMES)) {
      it(`re-derives the target spot within tolerance (${regimeName})`, async () => {
        const { bLt, bGt } = computeBalances(
          LIQUIDITIES.large,
          prices.sqrtPspot,
          prices.sqrtPmin,
          prices.sqrtPmax,
        )
        const { sqrtPriceSpot } = computeLiquidityAndPrice(
          bLt,
          bGt,
          prices.sqrtPmin,
          prices.sqrtPmax,
        )

        const drift =
          sqrtPriceSpot >= prices.sqrtPspot
            ? sqrtPriceSpot - prices.sqrtPspot
            : prices.sqrtPspot - sqrtPriceSpot

        // Integer truncation may move the implied sqrt spot by dust only: a few wei, and in any
        // case <= 1e-12 relative. The stale product form missed the target by ~1e-2 relative in
        // the cheapToken0 regime.
        const allowed = prices.sqrtPspot / 10n ** 12n

        expect(drift).toBeLessThanOrEqual(allowed > 10n ? allowed : 10n)
      })
    }
  })
})
