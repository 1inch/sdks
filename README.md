# @1inch/sdks - multi-language SDKs monorepo

A collection of 1inch Protocol SDKs, managed as a [pnpm](https://pnpm.io) workspace with [Nx](https://nx.dev). TypeScript SDKs are available today; Rust and Python SDKs are planned.

## 📦 Packages

| Package                                                                  | Source                                       | Description                                                                                                                                     |
| ------------------------------------------------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@1inch/aqua-sdk`](https://www.npmjs.com/package/@1inch/aqua-sdk)       | [`typescript/aqua`](typescript/aqua)         | SDK for the [Aqua Protocol](https://github.com/1inch/aqua) — encoding/decoding `ship`/`dock` operations and parsing protocol events             |
| [`@1inch/swap-vm-sdk`](https://www.npmjs.com/package/@1inch/swap-vm-sdk) | [`typescript/swap-vm`](typescript/swap-vm)   | SDK for the [Swap VM Protocol](https://github.com/1inch/swap-vm) — building `quote`/`swap` transactions, instruction system, maker/taker traits |
| [`@1inch/sdk-core`](https://www.npmjs.com/package/@1inch/sdk-core)       | [`typescript/sdk-core`](typescript/sdk-core) | Shared core utilities and types used by all SDKs                                                                                                |

Each package is versioned and published independently to npm and GitHub Packages.

### Using an SDK

```bash
pnpm add @1inch/aqua-sdk     # or npm install / yarn add
pnpm add @1inch/swap-vm-sdk
```

See the per-package READMEs for quick-start examples and API documentation:

- [Aqua SDK documentation](typescript/aqua/README.md)
- [Swap VM SDK documentation](typescript/swap-vm/README.md)

## 📁 Project structure

```
sdks/
├── typescript/         # TypeScript SDKs (see typescript/README.md)
│   ├── aqua/           # @1inch/aqua-sdk
│   ├── sdk-core/       # @1inch/sdk-core — shared core among all SDKs
│   └── swap-vm/        # @1inch/swap-vm-sdk
├── contracts/          # Solidity test contracts compiled with Foundry
├── scripts/            # Helper scripts (Nx dependency graph)
└── .github/workflows/  # CI: PR validation and release/publishing
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 22.0.0
- [pnpm](https://pnpm.io) >= 10.0.0
- [Foundry](https://getfoundry.sh) (`forge` — for contract compilation)
- [Docker](https://www.docker.com) (only for e2e tests)

### Installation

```bash
# Install dependencies
pnpm install

# Build Solidity contracts (required before build, lint, type-check and tests)
pnpm build:contracts
```

> **Note:** `pnpm build:contracts` (`forge build`) generates contract ABIs into `dist/contracts`,
> which the TypeScript sources import via the `@contracts/*` alias. The output is gitignored,
> so re-run it on a fresh clone and after pulling contract changes.

## 🛠️ Development

Common workspace commands (run from the repo root):

```bash
pnpm build        # Build all SDKs
pnpm test         # Run unit tests for all SDKs
pnpm lint         # Lint all SDKs (pnpm lint:fix to auto-fix)
pnpm lint:types   # Type-check all SDKs
pnpm format       # Format code (pnpm format:check to verify)
```

Work with a single SDK using Nx (project names: `aqua`, `swap-vm`, `sdk-core`):

```bash
pnpm nx build aqua
pnpm nx test swap-vm
```

CI runs only against changed packages via `pnpm affected:build`, `affected:test` and `affected:lint`.

See [typescript/README.md](typescript/README.md) for the full command reference, release process and tooling configuration.

## 🧪 Testing

```bash
# Unit tests
pnpm test

# End-to-end tests (require Docker)
pnpm test:e2e
```

The e2e suites use [testcontainers](https://testcontainers.com) to launch an [Anvil](https://getfoundry.sh/anvil/overview) node forked from Ethereum mainnet, then execute real swaps against it. The fork RPC endpoint can be overridden with environment variables:

```bash
FORK_URL=https://ethereum-rpc.publicnode.com pnpm test:e2e
```

- `FORK_URL` — mainnet RPC endpoint to fork from (recommended: the default endpoint is not always reliable)
- `FORK_HEADER` — optional extra HTTP header for the fork RPC request

## 🚢 Release & Publishing

Releases are triggered manually from GitHub Actions ("Release typescript" workflow): pick the SDK and semver bump, and the workflow versions, tags (e.g. `aqua/v1.0.0`), generates the changelog and publishes to npmjs and GitHub Packages. Details in [typescript/README.md](typescript/README.md#-release--publishing).

## 📄 License

Each package is licensed separately — see the `LICENSE` file in the package directory:

- [`typescript/aqua/LICENSE`](typescript/aqua/LICENSE)
- [`typescript/swap-vm/LICENSE`](typescript/swap-vm/LICENSE)
