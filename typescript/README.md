# @1inch/sdks - Multi-Language SDKs Monorepo

This repository contains a collection of 1inch Protocol SDKs, managed with NX monorepo tooling.

## 📁 Project Structure

```
sdks/
├── typescript/          # TypeScript SDKs
│   ├── aqua/           # Aqua Protocol SDK
│   ├── cross-chain/    # Cross-chain Protocol SDK
│   ├── fusion/         # Fusion Protocol SDK
│   ├── limit-order/    # Limit Order Protocol SDK
│   ├── sdk-core/       # Internal shared utilities (not published)
│   └── swap-vm/        # Swap VM SDK
├── rust/               # Rust SDKs (future)
└── python/             # Python SDKs (future)
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 8.0.0
- Foundry/Forge (for contract compilation)

### Installation

```bash
# Install dependencies
pnpm install

# Build Solidity contracts (required for tests and linting)
pnpm build:contracts
```

## 📦 Available SDKs

Each SDK is an independent package that can be published and used separately.

### @1inch/aqua-sdk
SDK for interacting with the 1inch Aqua Protocol.

```bash
# Build
pnpm aqua:build

# Test
pnpm aqua:test

# Lint
pnpm aqua:lint

# Lint with auto-fix
pnpm aqua:lint:fix
```

### @1inch/cross-chain-sdk
SDK for 1inch Cross-chain Protocol operations.

```bash
# Build
pnpm cross-chain:build

# Test
pnpm cross-chain:test

# Lint
pnpm cross-chain:lint

# Lint with auto-fix
pnpm cross-chain:lint:fix
```

### @1inch/fusion-sdk
SDK for 1inch Fusion Protocol operations.

```bash
# Build
pnpm fusion:build

# Test
pnpm fusion:test

# Lint
pnpm fusion:lint

# Lint with auto-fix
pnpm fusion:lint:fix
```

### @1inch/limit-order-sdk
SDK for 1inch Limit Order Protocol operations.

```bash
# Build
pnpm limit-order:build

# Test
pnpm limit-order:test

# Lint
pnpm limit-order:lint

# Lint with auto-fix
pnpm limit-order:lint:fix
```

### @1inch/swap-vm-sdk
SDK for 1inch Swap VM operations.

```bash
# Build
pnpm swap-vm:build

# Test
pnpm swap-vm:test

# Lint
pnpm swap-vm:lint

# Lint with auto-fix
pnpm swap-vm:lint:fix
```

## 🛠️ Development

### Common Commands

```bash
# Build Solidity contracts (required before first lint)
pnpm build:contracts

# Build all SDKs
pnpm build

# Test all SDKs
pnpm test

# Lint all SDKs
pnpm lint

# Lint and auto-fix all SDKs
pnpm lint:fix

# Type check
pnpm lint:types

# Format code
pnpm format

# Format check
pnpm format:check

# Clean build artifacts
pnpm clean

# Reset NX cache
pnpm reset

# View dependency graph in browser (no files created)
pnpm graph:view

# Generate dependency graph to file (saves to dist/graphs/)
pnpm graph

# Clean up generated graph files
pnpm clean:graph

# Work with affected packages only (used in CI for PRs)
pnpm affected:build      # Builds only changed SDKs
pnpm affected:test       # Tests only changed SDKs
pnpm affected:lint       # Lints only changed SDKs
pnpm affected:lint:fix   # Lints and fixes only changed SDKs
```

### Individual SDK Development

Each SDK can be developed independently:

```bash
# From the root directory

# Build contracts first (if not already done)
pnpm build:contracts

# Build specific SDK
pnpm aqua:build

# Test specific SDK
pnpm aqua:test

# Lint specific SDK
pnpm aqua:lint

# Type check all SDKs
pnpm lint:types
```

## 🚀 Release & Publishing

### Release Process

1. **Create a new release:**
   - Go to GitHub Actions → "Release new version"
   - Select the SDK to release
   - Choose version bump type (patch, minor, major, prerelease)

2. **Automatic publishing:**
   - The release workflow creates a version tag (e.g., `aqua-v1.0.0`)
   - This triggers the publish workflow automatically
   - The SDK is published to public NPM registry

### Manual Publishing

If needed, you can publish manually:

```bash
# Build the SDK
pnpm nx build <sdk-name>

# Navigate to SDK directory
cd typescript/<sdk-name>

# Publish to NPM
pnpm publish dist --access=public
```

### Version Tags

Each SDK has independent versioning with specific tag patterns:
- `aqua-v*.*.*` - @1inch/aqua-sdk
- `cross-chain-v*.*.*` - @1inch/cross-chain-sdk
- `fusion-v*.*.*` - @1inch/fusion-sdk
- `limit-order-v*.*.*` - @1inch/limit-order-sdk
- `swap-vm-v*.*.*` - @1inch/swap-vm-sdk

## 🔧 Configuration

- **TypeScript**: Uses `@1inch/tsconfig` as base configuration
- **ESLint**: Uses `@1inch/eslint-config` for code style
- **Testing**: Vitest for fast test execution
- **Building**: tsdown for TypeScript compilation
- **Contracts**: Forge/Foundry for Solidity compilation
