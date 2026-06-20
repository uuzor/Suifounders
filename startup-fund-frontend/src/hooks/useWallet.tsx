'use client';

/**
 * Custom wallet connection hook with enhanced functionality
 */

import { useCurrentAccount, useDAppKit, useCurrentWallet, useCurrentNetwork } from '@mysten/dapp-kit-react';
import { useState, useCallback } from 'react';
import type { TransactionResult } from '@/lib/contracts/types';
import { getExplorerUrl } from '@/lib/contracts/transactions';

// ============ Connection Hook ============

export function useWallet() {
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const { connectionStatus, wallet } = useCurrentWallet();
  const network = useCurrentNetwork();

  const isConnected = !!account;
  const address = account?.address || null;

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const connect = useCallback(async () => {
    try {
      await dAppKit.connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, [dAppKit]);

  const disconnect = useCallback(async () => {
    try {
      await dAppKit.disconnectWallet();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }, [dAppKit]);

  return {
    // Connection state
    isConnected,
    address,
    shortAddress,
    connectionStatus,
    wallet,
    network,
    
    // Actions
    connect,
    disconnect,
    
    // Explorer
    getExplorerUrl: (digest: string) => getExplorerUrl(digest, network),
  };
}

// ============ Transaction Hook ============

export function useTransaction() {
  const { isConnected, network } = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(
    txFn: () => Promise<TransactionResult>
  ): Promise<{ success: boolean; digest?: string; error?: string; data?: T }> => {
    if (!isConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsPending(true);
    setError(null);

    try {
      const result = await txFn();

      if (!result.success) {
        setError(result.error || 'Transaction failed');
        return { success: false, error: result.error };
      }

      return { success: true, digest: result.digest };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsPending(false);
    }
  }, [isConnected]);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    execute,
    isPending,
    error,
    reset,
    explorerUrl: (digest: string) => getExplorerUrl(digest, network),
  };
}

// ============ Toast/Notification Hook (for future) ============

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto dismiss
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 5000);

    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    return showToast({ type: 'success', title, message });
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    return showToast({ type: 'error', title, message, duration: 8000 });
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    return showToast({ type: 'info', title, message });
  }, [showToast]);

  return {
    toasts,
    showToast,
    dismissToast,
    success,
    error,
    info,
  };
}

// ============ Balance Hook ============

export function useBalance() {
  const { address, network } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // This would be implemented with actual queries
  const refresh = useCallback(async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      // In real implementation, call the query
      // const bal = await fetchBalance(address);
      // setBalance(bal);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  return {
    balance,
    formatted: formatBalance(balance),
    isLoading,
    refresh,
  };
}

function formatBalance(mist: number): string {
  const sui = mist / 1_000_000_000;
  if (sui >= 1_000_000) {
    return `◎${(sui / 1_000_000).toFixed(2)}M`;
  }
  if (sui >= 1_000) {
    return `◎${(sui / 1_000).toFixed(2)}K`;
  }
  return `◎${sui.toFixed(2)}`;
}
