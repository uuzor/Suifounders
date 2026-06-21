'use client';

import dynamic from 'next/dynamic';

// Dynamically import the ConnectButton to avoid SSR issues with Lit web components
const DynamicConnectButton = dynamic(
  () => import('@mysten/dapp-kit-react/ui').then((mod) => mod.ConnectButton),
  { 
    ssr: false,
    loading: () => <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Connecting...</button>
  }
);

interface SuiConnectButtonProps {
  className?: string;
}

export function SuiConnectButton({ className }: SuiConnectButtonProps = {}) {
  return (
    <div className={className}>
      <DynamicConnectButton />
    </div>
  );
}
