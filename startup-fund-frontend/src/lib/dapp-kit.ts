import { createDAppKit } from '@mysten/dapp-kit-core';

// Network configuration
export const RPC_URLS: Record<string, string> = {
  mainnet: 'https://mainnet.mvr.mystenlabs.com',
  testnet: 'https://testnet.mvr.mystenlabs.com',
  devnet: 'https://devnet.mvr.mystenlabs.com',
};

// ============ Contract Package IDs ============
// UPDATE THESE AFTER PUBLISHING CONTRACTS
// Run: sui client publish --json

export const PACKAGE_IDS: Record<string, string> = {
  // After publishing contracts, update these IDs
  // Example: testnet: '0x1234abcd...5678efgh'
  testnet: process.env.NEXT_PUBLIC_PACKAGE_ID || '0x0',
  mainnet: process.env.NEXT_PUBLIC_MAINNET_PACKAGE_ID || '0x0',
};

// Original package IDs for type queries (never changes after first publish)
export const ORIGINAL_PACKAGE_IDS: Record<string, string> = {
  testnet: process.env.NEXT_PUBLIC_ORIGINAL_PACKAGE_ID || '0x0',
  mainnet: process.env.NEXT_PUBLIC_MAINNET_ORIGINAL_PACKAGE_ID || '0x0',
};

// ============ Shared Object IDs ============
// These are the object IDs for shared objects (Registry, Marketplace, etc.)

export const OBJECT_IDS: Record<string, {
  registry: string;
  marketplace: string;
  treasury: string;
}> = {
  testnet: {
    registry: process.env.NEXT_PUBLIC_REGISTRY_ID || '0x0',
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_ID || '0x0',
    treasury: process.env.NEXT_PUBLIC_TREASURY_ID || '0x0',
  },
  mainnet: {
    registry: process.env.NEXT_PUBLIC_MAINNET_REGISTRY_ID || '0x0',
    marketplace: process.env.NEXT_PUBLIC_MAINNET_MARKETPLACE_ID || '0x0',
    treasury: process.env.NEXT_PUBLIC_MAINNET_TREASURY_ID || '0x0',
  },
};

// ============ Module Names ============

export const MODULES = {
  STARTUP_REGISTRY: 'startup_registry',
  REVENUE_TOKEN: 'revenue_token',
  FUNDING_POOL: 'funding_pool',
  GOVERNANCE: 'governance',
  TOKEN_MARKETPLACE: 'token_marketplace',
} as const;

// ============ Helper Functions ============

/**
 * Get current package ID for the active network
 */
export function getPackageId(network: string): string {
  return PACKAGE_IDS[network] || '0x0';
}

/**
 * Get shared object ID by type
 */
export function getObjectId(network: string, type: 'registry' | 'marketplace' | 'treasury'): string {
  return OBJECT_IDS[network]?.[type] || '0x0';
}

/**
 * Build a full module::function target string
 */
export function buildTarget(module: keyof typeof MODULES, func: string, network = 'testnet'): string {
  const pkg = getPackageId(network);
  return `${pkg}::${MODULES[module]}::${func}`;
}
