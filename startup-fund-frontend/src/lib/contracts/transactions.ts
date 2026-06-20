/**
 * Transaction builders for Startup Fund smart contracts
 * All write operations that interact with the blockchain
 */

import { Transaction } from '@mysten/sui/transactions';
import { useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
import { PACKAGE_IDS } from '../dapp-kit';
import type { TransactionResult } from './types';

// Constants
export const MIST_PER_SUI = 1_000_000_000;

// ============ Startup Registry Transactions ============

/**
 * Register a new startup
 */
export async function registerStartup(
  registryId: string,
  name: string,
  description: string,
  whitepaperBlobId: string,
  pitchDeckBlobId?: string,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

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
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate a startup (move from PENDING to TRIAL)
 */
export async function validateStartup(
  registryId: string,
  startupId: string,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::startup_registry::validate_startup`,
    arguments: [
      tx.object(registryId),
      tx.pure.id(startupId),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update startup metadata
 */
export async function updateStartupData(
  registryId: string,
  startupId: string,
  ownerCapId: string,
  newName?: string,
  newDescription?: string,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::startup_registry::update_startup_data`,
    arguments: [
      tx.object(registryId),
      tx.object(ownerCapId),
      tx.pure.string(newName || ''),
      tx.pure.string(newDescription || ''),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Revenue Token Transactions ============

/**
 * Create revenue tokens for a startup (called by admin)
 */
export async function createRevenueToken(
  witness: string, // OTW witness object ID
  startupId: string,
  maxSupply: number,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::revenue_token::create_revenue_token`,
    arguments: [
      tx.object(witness),
      tx.pure.id(startupId),
      tx.pure.u64(maxSupply),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Funding Pool Transactions ============

/**
 * Create a funding pool for a startup
 */
export async function createFundingPool(
  startupId: string,
  revenueTokenId: string,
  minRaise: number,
  maxRaise: number,
): Promise<TransactionResult> {
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
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Deposit SUI to a funding pool (invest)
 */
export async function depositToPool(
  poolId: string,
  amountSui: number,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();

  const amountMist = BigInt(amountSui * MIST_PER_SUI);
  const tx = new Transaction();

  // Split the amount from gas coin
  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)]);

  tx.moveCall({
    target: `${PACKAGE_IDS['testnet']}::funding_pool::deposit`,
    arguments: [
      tx.object(poolId),
      payment,
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Withdraw from funding pool (burn tokens)
 */
export async function withdrawFromPool(
  poolId: string,
  treasuryCapId: string,
  tokenAmount: number,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::funding_pool::withdraw`,
    arguments: [
      tx.object(poolId),
      tx.object(treasuryCapId),
      tx.pure.u64(tokenAmount),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Claim initial funds from pool (50% after goal reached)
 */
export async function claimInitialFunds(
  poolId: string,
  recipient: string,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::funding_pool::claim_initial_funds`,
    arguments: [
      tx.object(poolId),
      tx.pure.address(recipient),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Governance Transactions ============

/**
 * Create governance for a startup
 */
export async function createGovernance(
  startupId: string,
  fundingPoolId: string,
  revenueTokenId: string,
  minProposalThreshold: number,
  minVotingThreshold: number,
  votingPeriodEpochs: number,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::governance::create_governance`,
    arguments: [
      tx.pure.id(startupId),
      tx.pure.id(fundingPoolId),
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
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a token release proposal
 */
export async function createReleaseProposal(
  governanceId: string,
  recipient: string,
  amount: number,
  title: string,
  description: string,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::governance::create_release_proposal`,
    arguments: [
      tx.object(governanceId),
      tx.pure.address(recipient),
      tx.pure.u64(amount),
      tx.pure.string(title),
      tx.pure.string(description),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a general proposal
 */
export async function createGeneralProposal(
  governanceId: string,
  title: string,
  description: string,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::governance::create_general_proposal`,
    arguments: [
      tx.object(governanceId),
      tx.pure.string(title),
      tx.pure.string(description),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cast a vote on a proposal
 */
export async function castVote(
  governanceId: string,
  proposalId: string,
  support: boolean,
  votingPower: number,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::governance::vote`,
    arguments: [
      tx.object(governanceId),
      tx.pure.id(proposalId),
      tx.pure.bool(support),
      tx.pure.u64(votingPower),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * End voting period for a proposal
 */
export async function endVoting(
  governanceId: string,
  proposalId: string,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::governance::end_voting`,
    arguments: [
      tx.object(governanceId),
      tx.pure.id(proposalId),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute a passed proposal
 */
export async function executeProposal(
  governanceId: string,
  proposalId: string,
  fundingPoolId: string,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::governance::execute_proposal`,
    arguments: [
      tx.object(governanceId),
      tx.pure.id(proposalId),
      tx.object(fundingPoolId),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Marketplace Transactions ============

/**
 * Create a fixed-price listing
 */
export async function createListing(
  marketplaceId: string,
  startupId: string,
  tokenIds: string[],
  quantity: number,
  pricePerToken: number,
  expiresAt: number = 0,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const totalPrice = quantity * pricePerToken * MIST_PER_SUI;
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::token_marketplace::create_listing`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(startupId),
      tx.pure.vector('0x2::object::ID', tokenIds),
      tx.pure.u64(quantity),
      tx.pure.u64(pricePerToken * MIST_PER_SUI),
      tx.pure.u64(expiresAt),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create an auction listing
 */
export async function createAuction(
  marketplaceId: string,
  startupId: string,
  tokenIds: string[],
  quantity: number,
  startingPrice: number,
  durationEpochs: number,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::token_marketplace::create_auction`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(startupId),
      tx.pure.vector('0x2::object::ID', tokenIds),
      tx.pure.u64(quantity),
      tx.pure.u64(startingPrice * MIST_PER_SUI),
      tx.pure.u64(durationEpochs),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Buy tokens at fixed price
 */
export async function buyTokens(
  marketplaceId: string,
  listingId: string,
  quantity: number,
  pricePerToken: number,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();

  const totalPrice = BigInt(quantity * pricePerToken * MIST_PER_SUI);
  const tx = new Transaction();

  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(totalPrice)]);

  tx.moveCall({
    target: `${PACKAGE_IDS['testnet']}::token_marketplace::buy_tokens`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(listingId),
      tx.pure.u64(quantity),
      payment,
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Place a bid in an auction
 */
export async function placeBid(
  marketplaceId: string,
  listingId: string,
  bidAmount: number,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();

  const bidMist = BigInt(bidAmount * MIST_PER_SUI);
  const tx = new Transaction();

  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(bidMist)]);

  tx.moveCall({
    target: `${PACKAGE_IDS['testnet']}::token_marketplace::place_bid`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(listingId),
      tx.pure.u64(bidMist),
      payment,
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * End an auction
 */
export async function endAuction(
  marketplaceId: string,
  listingId: string,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::token_marketplace::end_auction`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(listingId),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Make an offer directly to token holder
 */
export async function makeOffer(
  marketplaceId: string,
  startupId: string,
  tokenOwner: string,
  quantity: number,
  pricePerToken: number,
  expiresAt: number,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();

  const totalPrice = BigInt(quantity * pricePerToken * MIST_PER_SUI);
  const tx = new Transaction();

  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(totalPrice)]);

  tx.moveCall({
    target: `${PACKAGE_IDS['testnet']}::token_marketplace::make_offer`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(startupId),
      tx.pure.address(tokenOwner),
      tx.pure.u64(quantity),
      tx.pure.u64(pricePerToken * MIST_PER_SUI),
      tx.pure.u64(expiresAt),
      payment,
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Accept an offer
 */
export async function acceptOffer(
  marketplaceId: string,
  offerId: string,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::token_marketplace::accept_offer`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.id(offerId),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Withdraw accumulated funds from marketplace
 */
export async function withdrawMarketplaceFunds(
  marketplaceId: string,
  amount: number,
): Promise<TransactionResult> {
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const packageId = PACKAGE_IDS['testnet'];

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::token_marketplace::withdraw_funds`,
    arguments: [
      tx.object(marketplaceId),
      tx.pure.u64(amount * MIST_PER_SUI),
    ],
  });

  try {
    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

    if (result.$kind === 'FailedTransaction') {
      return {
        digest: '',
        success: false,
        error: result.FailedTransaction.status.error?.message || 'Transaction failed',
      };
    }

    const digest = result.Transaction.digest;
    await client.core.waitForTransaction({ digest });

    return { digest, success: true };
  } catch (error) {
    return {
      digest: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Utility Functions ============

/**
 * Format SUI amount for display
 */
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

/**
 * Parse SUI string to MIST
 */
export function parseSui(suiString: string): number {
  const num = parseFloat(suiString);
  if (isNaN(num)) return 0;
  return Math.round(num * MIST_PER_SUI);
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(digest: string, network: string = 'testnet'): string {
  const baseUrl = network === 'mainnet' 
    ? 'https://explorer.sui.io' 
    : 'https://explorer.sui.io/txn';
  return `${baseUrl}/${digest}?network=${network}`;
}
