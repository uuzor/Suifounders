import { createDAppKit } from '@mysten/dapp-kit-react';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import type { ClientWithCoreApi } from '@mysten/sui/client';

// Network configuration
export const GRPC_URLS: Record<string, string> = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
};

// ============ Contract Package IDs ============

export const PACKAGE_IDS: Record<string, string> = {
  testnet: process.env.NEXT_PUBLIC_PACKAGE_ID || '0x68a68f787b301b5a67e8d03fd3d9a8c51cf14266ddc42d905c40d2f8fb420e0c',
  mainnet: process.env.NEXT_PUBLIC_MAINNET_PACKAGE_ID || '0x0',
};

// ============ Shared Object IDs ============

export const OBJECT_IDS: Record<string, {
  registry: string;
  marketplace: string;
  treasury: string;
}> = {
  testnet: {
    registry: process.env.NEXT_PUBLIC_REGISTRY_ID || '0x98a184620e6425aa88f4393d9e95b621f5dd7b3259caad974780e5e16a708db9',
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_ID || '0xplaceholder',
    treasury: process.env.NEXT_PUBLIC_TREASURY_ID || '0x0',
  },
  mainnet: {
    registry: process.env.NEXT_PUBLIC_MAINNET_REGISTRY_ID || '0x0',
    marketplace: process.env.NEXT_PUBLIC_MAINNET_MARKETPLACE_ID || '0x0',
    treasury: process.env.NEXT_PUBLIC_MAINNET_TREASURY_ID || '0x0',
  },
};

// ============ Marketplace ID (convenience export) ============
export const MARKETPLACE_ID = OBJECT_IDS.testnet.marketplace;

// ============ Module Names ============

export const MODULES = {
  STARTUP_REGISTRY: 'startup_registry',
  REVENUE_TOKEN: 'revenue_token',
  FUNDING_POOL: 'funding_pool',
  GOVERNANCE: 'governance',
  MARKETPLACE: 'marketplace',
} as const;

// ============ dApp Kit Instance (lazy singleton) ============

type Network = 'testnet' | 'mainnet';

function createClient(network: string): ClientWithCoreApi {
  return new SuiJsonRpcClient({
    url: GRPC_URLS[network] || GRPC_URLS.testnet,
    network: network as 'mainnet' | 'testnet' | 'devnet',
  }) as unknown as ClientWithCoreApi;
}

// Lazy singleton - only create on client side
let dAppKitInstance: ReturnType<typeof createDAppKit<Network[], ClientWithCoreApi>> | null = null;

export function getDAppKit() {
  // Only create instance on client side
  if (typeof window !== 'undefined' && !dAppKitInstance) {
    dAppKitInstance = createDAppKit<Network[], ClientWithCoreApi>({
      networks: ['testnet', 'mainnet'],
      defaultNetwork: 'testnet',
      createClient,
      autoConnect: true,
    });
  }
  return dAppKitInstance;
}

// For backward compatibility - returns null during SSR
export const dAppKit = typeof window !== 'undefined' ? getDAppKit() : null;

// TypeScript augmentation for hooks
declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: ReturnType<typeof createDAppKit<Network[], ClientWithCoreApi>>;
  }
}

// ============ Helper Functions ============

export function getPackageId(network: string): string {
  return PACKAGE_IDS[network] || '0x0';
}

export function getObjectId(network: string, type: 'registry' | 'marketplace' | 'treasury'): string {
  return OBJECT_IDS[network]?.[type] || '0x0';
}

export function buildTarget(module: keyof typeof MODULES, func: string, network = 'testnet'): string {
  const pkg = getPackageId(network);
  return `${pkg}::${MODULES[module]}::${func}`;
}
