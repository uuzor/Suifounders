# Suifounders

> Institutional-Grade Startup Tokenization Platform on Sui Blockchain

## Overview

Suifounders is a decentralized platform for tokenizing startups, enabling:
- **Startup Registry**: On-chain registration for MVPs with Walrus storage
- **Revenue Tokens**: Fungible equity-share tokens per startup
- **Funding Pools**: Investors lock SUI to receive tokens (equity + voting rights)
- **Governance**: Token holders vote on fund releases
- **Token Marketplace**: OpenSea-style trading for startup tokens

## Project Structure

```
Suifounders/
├── sources/                    # Move smart contracts
│   ├── types.move             # Shared constants & error codes
│   ├── startup_registry.move   # On-chain startup registry
│   ├── revenue_token.move     # Revenue tokens per startup
│   ├── funding_pool.move       # Per-startup funding pools
│   ├── governance.move         # Separate governance module
│   └── token_marketplace.move  # Marketplace for token trading
├── tests/                     # Move tests
│   ├── full_flow_tests.move    # Startup lifecycle tests
│   └── marketplace_tests.move  # Marketplace tests
├── startup-fund-frontend/      # React/Next.js frontend
│   ├── src/
│   │   ├── app/               # Next.js pages
│   │   ├── components/        # UI components
│   │   ├── lib/              # Contract interactions
│   │   └── hooks/            # Custom React hooks
│   └── ...
└── Move.toml                  # Package configuration
```

## Smart Contracts

### Modules

| Module | Description |
|--------|-------------|
| `startup_registry` | Register and manage startups on-chain |
| `revenue_token` | Create fungible equity tokens |
| `funding_pool` | Manage funding with milestone releases |
| `governance` | DAO voting on proposals |
| `token_marketplace` | Fixed-price, auction, and offer trading |

### Key Features

- **Edition 2024**: Uses latest Move syntax
- **Dynamic Fields**: Efficient storage for investor positions
- **Event-Driven**: Full event emission for indexing
- **Error Codes**: Comprehensive error handling

## Frontend Stack

- **Framework**: Next.js 14 + React 18
- **Wallet**: @mysten/dapp-kit-react v2
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Sui CLI installed
- Node.js 18+
- npm or yarn

### Build Contracts
```bash
sui move build
```

### Run Tests
```bash
sui move test
```

### Setup Frontend
```bash
cd startup-fund-frontend
cp .env.example .env.local
# Update .env.local with contract IDs after publishing
npm install
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPLETE TOKENIZATION FLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. STARTUP CREATION                                                │
│     Registry → Startup registered with metadata                      │
│                                                                      │
│  2. REVENUE TOKEN CREATED                                           │
│     TreasuryCap → Token holders get equity                           │
│                                                                      │
│  3. FUNDING ROUND                                                   │
│     Investors deposit SUI → Receive tokens (1:1)                    │
│     FundingPool → Initial 50% release when goal met                 │
│                                                                      │
│  4. GOVERNANCE                                                       │
│     Token holders vote on fund releases                              │
│                                                                      │
│  5. SECONDARY TRADING (MARKETPLACE)                                 │
│     Fixed Price | Auction | Direct Offer                             │
│                                                                      │
│  6. REVENUE DISTRIBUTION                                             │
│     Startup generates revenue → Distributed to token holders         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## License

Apache-2.0