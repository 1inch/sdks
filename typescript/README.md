# 1inch Protocol TypeScript SDKs

This is the TypeScript workspace containing all 1inch Protocol SDKs.

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all SDKs
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint:fix
```

## Available SDKs

- `@1inch/sdk-shared` - Shared utilities and types
- `@1inch/aqua-sdk` - Aqua Protocol SDK
- `@1inch/cross-chain-sdk` - Cross-chain SDK
- `@1inch/fusion-sdk` - Fusion SDK
- `@1inch/limit-order-sdk` - Limit Order SDK
- `@1inch/swap-vm-sdk` - SwapVM SDK

## Commands

All commands should be run from this `typescript/` directory:

```bash
# Development
pnpm nx build <sdk-name>
pnpm nx test <sdk-name>
pnpm nx lint <sdk-name>

# All SDKs
pnpm build
pnpm test
pnpm lint:fix
```
