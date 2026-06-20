/**
 * Transaction builders for Startup Fund smart contracts
 * Note: These are simplified stubs - actual implementation requires deployed contracts
 */

import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_IDS } from '../dapp-kit';
import type { TransactionResult } from './types';

export const MIST_PER_SUI = 1_000_000_000;

export async function registerStartup(
  _registryId: string,
  _name: string,
  _description: string,
  _whitepaperBlobId: string,
  _pitchDeckBlobId?: string,
): Promise<TransactionResult> {
  return { digest: '', success: false, error: 'Contracts not deployed' };
}

export async function validateStartup(
  _registryId: string,
  _startupId: string,
): Promise<TransactionResult> {
  return { digest: '', success: false, error: 'Contracts not deployed' };
}

export async function depositToPool(
  _poolId: string,
  _amountSui: number,
): Promise<TransactionResult> {
  return { digest: '', success: false, error: 'Contracts not deployed' };
}

export async function withdrawFromPool(
  _poolId: string,
  _treasuryCapId: string,
  _tokenAmount: number,
): Promise<TransactionResult> {
  return { digest: '', success: false, error: 'Contracts not deployed' };
}

export async function castVote(
  _governanceId: string,
  _proposalId: string,
  _support: boolean,
  _votingPower: number,
): Promise<TransactionResult> {
  return { digest: '', success: false, error: 'Contracts not deployed' };
}

export async function createListing(
  _marketplaceId: string,
  _startupId: string,
  _tokenIds: string[],
  _quantity: number,
  _pricePerToken: number,
  _expiresAt: number = 0,
): Promise<TransactionResult> {
  return { digest: '', success: false, error: 'Contracts not deployed' };
}

export async function buyTokens(
  _marketplaceId: string,
  _listingId: string,
  _quantity: number,
  _pricePerToken: number,
): Promise<TransactionResult> {
  return { digest: '', success: false, error: 'Contracts not deployed' };
}

export async function placeBid(
  _marketplaceId: string,
  _listingId: string,
  _bidAmount: number,
): Promise<TransactionResult> {
  return { digest: '', success: false, error: 'Contracts not deployed' };
}

export function formatSui(amountMist: number): string {
  const sui = amountMist / MIST_PER_SUI;
  if (sui >= 1_000_000) {
    return `${(sui / 1_000_000).toFixed(2)}M SUI`;
  }
  if (sui >= 1_000) {
    return `${(sui / 1_000).toFixed(2)}K SUI`;
  }
  return `${sui.toFixed(2)} SUI`;
}

export function parseSui(suiString: string): number {
  const num = parseFloat(suiString);
  if (isNaN(num)) return 0;
  return Math.round(num * MIST_PER_SUI);
}

export function getExplorerUrl(digest: string, network: string = 'testnet'): string {
  const baseUrl = network === 'mainnet' 
    ? 'https://explorer.sui.io' 
    : 'https://explorer.sui.io/txn';
  return `${baseUrl}/${digest}?network=${network}`;
}
