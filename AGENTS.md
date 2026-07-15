# AGENTS.md

## Cursor Cloud specific instructions

This repo (`@1inch/sdks`) is a **pnpm + Nx monorepo of TypeScript SDK libraries** (not runnable apps):
`@1inch/sdk-core`, `@1inch/aqua-sdk`, `@1inch/swap-vm-sdk` (all under `typescript/`).
"Running" the product means building the packages and exercising the test suites; the e2e suites
execute real swaps against a local Anvil mainnet fork.

Standard commands live in the root `package.json` scripts and `README.md`; prefer those. Key ones:
`pnpm build`, `pnpm lint`, `pnpm lint:types`, `pnpm test` (unit), `pnpm test:e2e`.

Non-obvious caveats for this environment:

- **Foundry is required and preinstalled** in this VM (at `~/.foundry/bin`, already on `PATH` via
  `~/.bashrc`). `forge`/`anvil` are available in login shells.
- **Build contracts before lint/type-check/test.** Run `pnpm build:contracts` (`forge build`) first —
  it generates the `dist/contracts` ABIs that the TypeScript sources import via `@contracts/*`.
  Lint, type-check, and (indirectly) tests fail without it. `dist/contracts` is gitignored, so rebuild
  after pulling contract changes.
- **e2e tests need Docker running.** Docker is preinstalled but the daemon is NOT auto-started. Start it
  once per session, e.g. `sudo dockerd &` (or in a tmux session). The `ubuntu` user is in the `docker`
  group, so in a fresh login shell `docker` works without sudo; within an already-open shell you may need
  `sg docker -c '<cmd>'` for the group membership to apply. e2e uses `testcontainers` to launch
  `ghcr.io/foundry-rs/foundry:v1.2.3` (Anvil) forked from Ethereum mainnet.
- **Set a working `FORK_URL` for e2e.** The default fork RPC hardcoded in the tests
  (`https://eth.llamarpc.com`) is frequently down (HTTP 521). Override it, e.g.
  `FORK_URL=https://ethereum-rpc.publicnode.com pnpm test:e2e`. Optional `FORK_HEADER` also supported.
- **A few `swap-vm` e2e tests assert exact floating-point prices** derived from the live mainnet fork
  state (the 2000–3000 concentrated-range tests and the 30bps-fee test). They can differ at the ~13th
  significant digit depending on the fork block / RPC provider, independent of any code change. The
  `aqua` e2e suite (3/3) is deterministic.
- The ESM build of `swap-vm` (`dist/index.mjs`) currently fails to import under strict Node ESM because a
  transitive dep (`@1inch/byte-utils`) uses an extensionless import; the CJS entry (`dist/index.js`) and
  the bundled/test toolchains work fine. Prefer the CJS entry for quick standalone Node scripts.
