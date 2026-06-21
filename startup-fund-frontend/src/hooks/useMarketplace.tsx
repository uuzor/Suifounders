'use client';

import { useState, useCallback } from 'react';
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_IDS, MARKETPLACE_ID } from '@/lib/dapp-kit';
import type { TransactionResult } from '@/lib/contracts/types';

// Constants
const MIST_PER_SUI = BigInt(1_000_000_000);

// ============ Types ============

export interface Listing {
  listing_id: string;
  startup_id: string;
  seller: string;
  listing_type: number;
  name: string;
  description: string;
  current_price: string;
  highest_bid: string;
  highest_bidder: string | null;
  expires_at: number;
  status: number;
  buyer: string | null;
}

export interface MarketplaceState {
  fee_percent: number;
  fee_address: string;
  total_volume: string;
}

// ============ Hook: Use Marketplace ============

export function useMarketplace() {
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const dAppKit = useDAppKit();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============ Create Auction Listing ============

  const createAuctionListing = useCallback(async (
    startupId: string,
    name: string,
    description: string,
    startingPriceSui: number,
    durationEpochs: number,
  ): Promise<TransactionResult> => {
    if (!account) {
      return { digest: '', success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = new Transaction();
      const priceMist = BigInt(startingPriceSui) * MIST_PER_SUI;

      tx.moveCall({
        target: `${PACKAGE_IDS.testnet}::marketplace::create_auction`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.pure.id(startupId),
          tx.pure.string(name),
          tx.pure.string(description),
          tx.pure.u64(priceMist),
          tx.pure.u64(durationEpochs),
        ],
      });

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

      if (result.$kind === 'FailedTransaction') {
        const errorMsg = result.FailedTransaction.status.error?.message || 'Transaction failed';
        setError(errorMsg);
        return { digest: '', success: false, error: errorMsg };
      }

      const digest = result.Transaction.digest;
      await client.core.waitForTransaction({ digest });

      return { digest, success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { digest: '', success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, dAppKit]);

  // ============ Create Fixed Price Listing ============

  const createFixedPriceListing = useCallback(async (
    startupId: string,
    name: string,
    description: string,
    priceSui: number,
  ): Promise<TransactionResult> => {
    if (!account) {
      return { digest: '', success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = new Transaction();
      const priceMist = BigInt(priceSui) * MIST_PER_SUI;

      tx.moveCall({
        target: `${PACKAGE_IDS.testnet}::marketplace::create_fixed_price`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.pure.id(startupId),
          tx.pure.string(name),
          tx.pure.string(description),
          tx.pure.u64(priceMist),
        ],
      });

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

      if (result.$kind === 'FailedTransaction') {
        const errorMsg = result.FailedTransaction.status.error?.message || 'Transaction failed';
        setError(errorMsg);
        return { digest: '', success: false, error: errorMsg };
      }

      const digest = result.Transaction.digest;
      await client.core.waitForTransaction({ digest });

      return { digest, success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { digest: '', success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, dAppKit]);

  // ============ Place Bid (PTB Style) ============

  const placeBid = useCallback(async (
    listingId: string,
    bidAmountSui: number,
    previousBidder?: string,
    previousBidAmountSui?: number,
  ): Promise<TransactionResult> => {
    if (!account) {
      return { digest: '', success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = new Transaction();
      const bidMist = BigInt(bidAmountSui) * MIST_PER_SUI;

      // Step 1: Split coin for bid
      const [bidCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(bidMist)]);

      // Step 2: Place bid
      tx.moveCall({
        target: `${PACKAGE_IDS.testnet}::marketplace::place_bid`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.pure.id(listingId),
          bidCoin,
        ],
      });

      // Step 3: Refund previous bidder if exists (PTB composition!)
      if (previousBidder && previousBidAmountSui) {
        const refundMist = BigInt(previousBidAmountSui) * MIST_PER_SUI;
        tx.moveCall({
          target: `${PACKAGE_IDS.testnet}::marketplace::refund_previous_bidder`,
          arguments: [
            tx.object(MARKETPLACE_ID),
            tx.pure.address(previousBidder),
            tx.pure.u64(refundMist),
          ],
        });
      }

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

      if (result.$kind === 'FailedTransaction') {
        const errorMsg = result.FailedTransaction.status.error?.message || 'Transaction failed';
        setError(errorMsg);
        return { digest: '', success: false, error: errorMsg };
      }

      const digest = result.Transaction.digest;
      await client.core.waitForTransaction({ digest });

      return { digest, success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { digest: '', success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, dAppKit]);

  // ============ Buy at Fixed Price (PTB Style) ============

  const buyFixedPrice = useCallback(async (
    listingId: string,
    priceSui: number,
  ): Promise<TransactionResult> => {
    if (!account) {
      return { digest: '', success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = new Transaction();
      const priceMist = BigInt(priceSui) * MIST_PER_SUI;

      // Step 1: Split coin for payment
      const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)]);

      // Step 2: Buy at fixed price (handles fee transfer internally)
      tx.moveCall({
        target: `${PACKAGE_IDS.testnet}::marketplace::buy_fixed`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.pure.id(listingId),
          payment,
        ],
      });

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

      if (result.$kind === 'FailedTransaction') {
        const errorMsg = result.FailedTransaction.status.error?.message || 'Transaction failed';
        setError(errorMsg);
        return { digest: '', success: false, error: errorMsg };
      }

      const digest = result.Transaction.digest;
      await client.core.waitForTransaction({ digest });

      return { digest, success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { digest: '', success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, dAppKit]);

  // ============ End Auction ============

  const endAuction = useCallback(async (
    listingId: string,
  ): Promise<TransactionResult> => {
    if (!account) {
      return { digest: '', success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_IDS.testnet}::marketplace::end_auction`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.pure.id(listingId),
        ],
      });

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

      if (result.$kind === 'FailedTransaction') {
        const errorMsg = result.FailedTransaction.status.error?.message || 'Transaction failed';
        setError(errorMsg);
        return { digest: '', success: false, error: errorMsg };
      }

      const digest = result.Transaction.digest;
      await client.core.waitForTransaction({ digest });

      return { digest, success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { digest: '', success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, dAppKit]);

  // ============ Withdraw Funds ============

  const withdrawFunds = useCallback(async (
    amountSui: number,
  ): Promise<TransactionResult> => {
    if (!account) {
      return { digest: '', success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = new Transaction();
      const amountMist = BigInt(amountSui) * MIST_PER_SUI;

      tx.moveCall({
        target: `${PACKAGE_IDS.testnet}::marketplace::withdraw_funds`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.pure.u64(amountMist),
        ],
      });

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

      if (result.$kind === 'FailedTransaction') {
        const errorMsg = result.FailedTransaction.status.error?.message || 'Transaction failed';
        setError(errorMsg);
        return { digest: '', success: false, error: errorMsg };
      }

      const digest = result.Transaction.digest;
      await client.core.waitForTransaction({ digest });

      return { digest, success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { digest: '', success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, dAppKit]);

  // ============ Deposit Funds ============

  const depositFunds = useCallback(async (
    amountSui: number,
  ): Promise<TransactionResult> => {
    if (!account) {
      return { digest: '', success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const tx = new Transaction();
      const amountMist = BigInt(amountSui) * MIST_PER_SUI;

      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)]);

      tx.moveCall({
        target: `${PACKAGE_IDS.testnet}::marketplace::deposit_funds`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          coin,
        ],
      });

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

      if (result.$kind === 'FailedTransaction') {
        const errorMsg = result.FailedTransaction.status.error?.message || 'Transaction failed';
        setError(errorMsg);
        return { digest: '', success: false, error: errorMsg };
      }

      const digest = result.Transaction.digest;
      await client.core.waitForTransaction({ digest });

      return { digest, success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { digest: '', success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, dAppKit]);

  // ============ Get User Balance ============

  const getUserBalance = useCallback(async (): Promise<bigint> => {
    if (!account) return BigInt(0);

    try {
      // Query marketplace object for user funds
      // This is a simplified version - actual implementation would use devInspectTransactionBlock
      return BigInt(0);
    } catch (err) {
      console.error('Error getting user balance:', err);
      return BigInt(0);
    }
  }, [account]);

  // ============ Get Listing ============

  const getListing = useCallback(async (listingId: string): Promise<Listing | null> => {
    try {
      // Query listing from marketplace object using getObject
      // This is a simplified version - actual implementation would query via events or indexed data
      return null;
    } catch (err) {
      console.error('Error getting listing:', err);
      return null;
    }
  }, []);

  // ============ Get Marketplace Info ============

  const getMarketplaceInfo = useCallback(async (): Promise<MarketplaceState | null> => {
    try {
      // Query marketplace object for info
      // This is a simplified version
      return null;
    } catch (err) {
      console.error('Error getting marketplace info:', err);
      return null;
    }
  }, []);

  return {
    // State
    isLoading,
    error,
    isConnected: !!account,
    
    // Listing Creation
    createAuctionListing,
    createFixedPriceListing,
    
    // Bidding & Buying
    placeBid,
    buyFixedPrice,
    endAuction,
    
    // Funds
    withdrawFunds,
    depositFunds,
    getUserBalance,
    
    // Queries
    getListing,
    getMarketplaceInfo,
  };
}

// ============ Listing Type Helpers ============

export const LISTING_TYPES = {
  AUCTION: 1,
  FIXED: 2,
} as const;

export const LISTING_STATUS = {
  ACTIVE: 0,
  SOLD: 1,
  CANCELLED: 2,
} as const;

export function getListingTypeName(type: number): string {
  switch (type) {
    case LISTING_TYPES.AUCTION: return 'Auction';
    case LISTING_TYPES.FIXED: return 'Fixed Price';
    default: return 'Unknown';
  }
}

export function getListingStatusName(status: number): string {
  switch (status) {
    case LISTING_STATUS.ACTIVE: return 'Active';
    case LISTING_STATUS.SOLD: return 'Sold';
    case LISTING_STATUS.CANCELLED: return 'Cancelled';
    default: return 'Unknown';
  }
}

export function formatPrice(priceMist: string | bigint): string {
  const price = typeof priceMist === 'string' ? BigInt(priceMist) : priceMist;
  const sui = Number(price) / Number(MIST_PER_SUI);
  return `${sui.toLocaleString()} SUI`;
}

export function parsePrice(suiString: string): bigint {
  const num = parseFloat(suiString);
  if (isNaN(num)) return BigInt(0);
  return BigInt(Math.round(num * Number(MIST_PER_SUI)));
}
