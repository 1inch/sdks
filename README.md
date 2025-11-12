# @1inch/sdks - multi-language SDKs monorepo

This repository contains a collection of 1inch Protocol SDKs.

## 📁 Project structure

```
sdks/
├── typescript/         # TypeScript SDKs
│   ├── aqua/           # Aqua Protocol SDK
│   ├── cross-chain/    # Cross-chain Protocol SDK
│   ├── fusion/         # Fusion Protocol SDK
│   ├── limit-order/    # Limit Order Protocol SDK
│   ├── sdk-core/       # Shared core among all sdks
│   └── swap-vm/        # Swap VM SDK
├── rust/               # Rust SDKs (future)
└── python/             # Python SDKs (future)
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 10.0.0
- Foundry/Forge (for contract compilation)

### Installation

```bash
# Install dependencies
pnpm install

# Build Solidity contracts (required for tests and linting)
pnpm build:contracts
```
