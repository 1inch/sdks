# @1inch/sdks - Multi-Language SDKs Monorepo

This repository contains a collection of 1inch Protocol SDKs, managed with NX monorepo tooling.

## 📁 Project Structure

```
sdks/
├── typescript/          # TypeScript SDKs
│   ├── aqua/           # Aqua Protocol SDK
│   ├── cross-chain/    # Cross-chain Protocol SDK
│   ├── fusion/         # Fusion Protocol SDK
│   └── limit-order/    # Limit Order Protocol SDK
├── rust/               # Rust SDKs (future)
└── python/             # Python SDKs (future)
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install
```

## 📦 Available SDKs

Each SDK is an independent package that can be used separately.

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

## 🛠️ Development

### Common Commands

```bash
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

# Clean build artifacts
pnpm clean

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
# Navigate to SDK directory
cd typescript/aqua

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Type check
pnpm type-check
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

## 🔧 Configuration

- **TypeScript**: Uses `@1inch/tsconfig` as base configuration
- **ESLint**: Uses `@1inch/eslint-config` for code style
- **Testing**: Jest with SWC for fast test execution
- **Building**: SWC for fast TypeScript compilation

## 📝 License

MIT
