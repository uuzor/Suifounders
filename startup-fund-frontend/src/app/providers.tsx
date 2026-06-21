'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createDAppKit } from '@mysten/dapp-kit-react';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

// Network configuration
const GRPC_URLS: Record<string, string> = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
};

function createClient(network: string) {
  return new SuiJsonRpcClient({
    url: GRPC_URLS[network] || GRPC_URLS.testnet,
    network: network as 'mainnet' | 'testnet' | 'devnet',
  });
}

// Dynamically import DAppKit to avoid SSR issues
const DynamicDAppKitProvider = dynamic(
  () => 
    import('@mysten/dapp-kit-react').then((mod) => {
      const dAppKit = createDAppKit({
        networks: ['testnet', 'mainnet'],
        defaultNetwork: 'testnet',
        createClient,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const DAppKitProvider = mod.DAppKitProvider as React.ComponentType<{ dAppKit: any; children: React.ReactNode }>;
      return function DAppKitWrapper({ children }: { children: React.ReactNode }) {
        return <DAppKitProvider dAppKit={dAppKit}>{children}</DAppKitProvider>;
      };
    }),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <DynamicDAppKitProvider>
        {children}
      </DynamicDAppKitProvider>
    </QueryClientProvider>
  );
}
