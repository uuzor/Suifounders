'use client';

import { DAppKitProvider } from '@mysten/dapp-kit-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { createDAppKit } from '@mysten/dapp-kit-core';
import type { DAppKitCompatibleClient } from '@mysten/dapp-kit-core';

// Lazy load the client to avoid SDK issues
let cachedClient: DAppKitCompatibleClient | null = null;

function getClient(): DAppKitCompatibleClient {
  if (!cachedClient) {
    // Using dynamic import to handle SDK typing issues
    cachedClient = createClientSync('testnet');
  }
  return cachedClient;
}

function createClientSync(network: string): DAppKitCompatibleClient {
  const { SuiJsonRpcClient } = require('@mysten/sui/jsonRpc');
  return new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl(network as 'testnet' | 'mainnet') });
}

const queryClient = new QueryClient();

// Create dApp Kit with testnet
const dAppKit = createDAppKit({
  networks: ['testnet', 'mainnet'],
  defaultNetwork: 'testnet',
  createClient: () => getClient(),
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>
        {children}
      </DAppKitProvider>
    </QueryClientProvider>
  );
}
