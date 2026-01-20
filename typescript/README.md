## 📦 Available SDKs

Each SDK is an independent package that can be published and used separately.

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
   - Go to GitHub Actions → "Release"
   - Pick the SDK to release (aqua, sdk-core, swap-vm)
   - Choose the bump (patch, minor, major, prerelease; prerelease can take a `preid`)
   - Dependents are not auto-bumped (NX `updateDependents=never`)

2. **Automatic publishing:**
   - The release workflow commits + tags (e.g., `aqua/v1.0.0`) and generates changelogs/GitHub Releases
   - Publish happens in the same workflow (split jobs for npmjs and GitHub Packages)
   - Prerelease bumps publish with npm dist-tag `next`; normal bumps use the default tag
   - Dry runs skip publishing and leave on-disk versions unchanged

### Version Tags

Each SDK has independent versioning with specific tag patterns:
- `aqua/v*.*.*` - @1inch/aqua-sdk
- `sdk-core/v*.*.*` - @1inch/sdk-core
- `swap-vm/v*.*.*` - @1inch/swap-vm-sdk

## 🔧 Configuration

- **TypeScript**: Uses `@1inch/tsconfig` as base configuration
- **ESLint**: Uses `@1inch/eslint-config` for code style
- **Testing**: Vitest for test execution
- **Building**: tsdown for TypeScript compilation
- **Contracts**: Forge/Foundry for Solidity compilation
