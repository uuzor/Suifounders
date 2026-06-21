/**
 * Transaction builders for Startup Fund smart contracts
 * Simplified implementation for build
 */

import { Transaction } from '@mysten/sui/transactions';
import { useDAppKit, useCurrentClient } from '@mysten/dapp-kit-react';
import { PACKAGE_IDS } from '../dapp-kit';

// Constants
export const MIST_PER_SUI = 1_000_000_000;

// ============ Startup Registry ============

export async function registerStartup(
  name: string,
  description: string,
  whitepaperBlobId: string,
  pitchDeckBlobId?: string
): Promise<{ success: boolean; digest?: string; error?: string }> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];
  const registryId = PACKAGE_IDS.registry;

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::startup_registry::register_startup`,
    arguments: [
      tx.object(registryId),
      tx.pure.string(name),
      tx.pure.string(description),
      tx.pure.string(whitepaperBlobId),
      tx.pure.string(pitchDeckBlobId || ''),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { success: true, digest };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function updateStartup(
  startupId: string,
  newName?: string,
  newDescription?: string
): Promise<{ success: boolean; digest?: string; error?: string }> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::startup_registry::update_metadata`,
    arguments: [
      tx.pure.id(startupId),
      tx.pure.string(newName || ''),
      tx.pure.string(newDescription || ''),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { success: true, digest };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Revenue Token ============

export async function createRevenueToken(
  startupId: string,
  maxSupply: number
): Promise<{ success: boolean; digest?: string; error?: string }> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::revenue_token::create_revenue_token`,
    arguments: [
      tx.pure.id(startupId),
      tx.pure.u64(maxSupply),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { success: true, digest };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Funding Pool ============

export async function createFundingPool(
  startupId: string,
  revenueTokenId: string,
  minRaise: number,
  maxRaise: number
): Promise<{ success: boolean; digest?: string; error?: string }> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::funding_pool::create_funding_pool`,
    arguments: [
      tx.pure.id(startupId),
      tx.pure.id(revenueTokenId),
      tx.pure.u64(minRaise),
      tx.pure.u64(maxRaise),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { success: true, digest };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Investment ============

export async function invest(
  fundingPoolId: string,
  amountSui: number
): Promise<{ success: boolean; digest?: string; error?: string }> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();

  const amountMist = amountSui * MIST_PER_SUI;
  const tx = new Transaction();

  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)]);

  tx.moveCall({
    target: `${PACKAGE_IDS['testnet']}::funding_pool::invest`,
    arguments: [
      tx.object(fundingPoolId),
      payment,
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { success: true, digest };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function claimRefund(
  fundingPoolId: string
): Promise<{ success: boolean; digest?: string; error?: string }> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();

  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_IDS['testnet']}::funding_pool::claim_refund`,
    arguments: [tx.object(fundingPoolId)],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { success: true, digest };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Governance ============

export async function createGovernance(
  startupId: string,
  fundingPoolId: string,
  revenueTokenId: string,
  minProposalThreshold: number,
  minVotingThreshold: number,
  votingPeriodEpochs: number
): Promise<{ success: boolean; digest?: string; error?: string }> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::governance::create_governance`,
    arguments: [
      tx.pure.id(startupId),
      tx.object(fundingPoolId),
      tx.pure.id(revenueTokenId),
      tx.pure.u64(minProposalThreshold),
      tx.pure.u64(minVotingThreshold),
      tx.pure.u64(votingPeriodEpochs),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { success: true, digest };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Revenue Distribution ============

export async function distributeRevenue(
  governanceId: string,
  recipient: string,
  amount: number
): Promise<{ success: boolean; digest?: string; error?: string }> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();

  const amountMist = amount * MIST_PER_SUI;
  const tx = new Transaction();

  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)]);

  tx.moveCall({
    target: `${PACKAGE_IDS['testnet']}::governance::distribute_revenue`,
    arguments: [
      tx.object(governanceId),
      tx.pure.address(recipient),
      payment,
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { success: true, digest };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Marketplace ============

export async function placeBid(
  marketplaceId: string,
  listingId: string,
  bidAmountSui: number
): Promise<{ success: boolean; digest?: string; error?: string }> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();

  const bidMist = bidAmountSui * MIST_PER_SUI;
  const tx = new Transaction();

  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(bidMist)]);

  tx.moveCall({
    target: `${PACKAGE_IDS['testnet']}::marketplace::place_bid`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(listingId),
      payment,
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { success: true, digest };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function buyFixedPrice(
  marketplaceId: string,
  listingId: string,
  priceSui: number
): Promise<{ success: boolean; digest?: string; error?: string }> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();

  const priceMist = priceSui * MIST_PER_SUI;
  const tx = new Transaction();

  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)]);

  tx.moveCall({
    target: `${PACKAGE_IDS['testnet']}::marketplace::buy_fixed`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(listingId),
      payment,
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { success: true, digest };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function endAuction(
  marketplaceId: string,
  listingId: string
): Promise<{ success: boolean; digest?: string; error?: string }> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();

  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_IDS['testnet']}::marketplace::end_auction`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(listingId),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { success: true, digest };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Helpers ============

export function getExplorerUrl(digest: string, network: string): string {
  const baseUrl = network === 'mainnet'
    ? 'https://suivision.xyz/txblock'
    : network === 'testnet'
    ? 'https://testnet.suivision.xyz/txblock'
    : 'https://devnet.suivision.xyz/txblock';
  return `${baseUrl}/${digest}`;
}

export function mistToSui(mist: number | bigint): number {
  const amountMist = typeof mist === 'bigint' ? mist : BigInt(mist);
  const amountSui = Number(amountMist) / MIST_PER_SUI;
  return amountSui;
}

export function suiToMist(sui: number): number {
  return Math.round(sui * MIST_PER_SUI);
}
