/**
 * Marketplace Transaction Builders
 * Uses PTB composition for complex flows
 */

import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_IDS } from '../dapp-kit';

// Constants
const MIST_PER_SUI = BigInt(1_000_000_000);

// ============ Marketplace ID (will be set after deployment) ============
export const MARKETPLACE_ID = PACKAGE_IDS.marketplace || '0xplaceholder';

// ============ PTB Transaction Builders ============

/**
 * Build PTB: Place Bid with automatic refund
 * 
 * Flow:
 * 1. Get current listing (to check prev bidder)
 * 2. Split coin for bid amount
 * 3. marketplace::place_bid(coin) - stores payment
 * 4. If outbid, marketplace::refund_previous_bidder
 */
export async function buildPlaceBidPTB(
  listingId: string,
  bidAmountSui: number,
): Promise<Transaction> {
  const tx = new Transaction();
  const bidMist = BigInt(bidAmountSui) * MIST_PER_SUI;
  
  // Step 1: Split payment from gas
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
  
  return tx;
}

/**
 * Build PTB: Place Bid with conditional refund
 * 
 * This version includes the refund logic in the PTB.
 * The refund will only execute if there's a previous bidder.
 */
export async function buildPlaceBidWithRefundPTB(
  listingId: string,
  bidAmountSui: number,
  previousBidder?: string,
  previousBidAmount?: number,
): Promise<Transaction> {
  const tx = new Transaction();
  const bidMist = BigInt(bidAmountSui) * MIST_PER_SUI;
  
  // Step 1: Split payment from gas
  const [bidCoin, refundCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(bidMist)]);
  
  // Step 2: Place bid
  tx.moveCall({
    target: `${PACKAGE_IDS.testnet}::marketplace::place_bid`,
    arguments: [
      tx.object(MARKETPLACE_ID),
      tx.pure.id(listingId),
      bidCoin,
    ],
  });
  
  // Step 3: Refund previous bidder if exists
  if (previousBidder && previousBidAmount) {
    const refundMist = BigInt(previousBidAmount) * MIST_PER_SUI;
    tx.moveCall({
      target: `${PACKAGE_IDS.testnet}::marketplace::refund_previous_bidder`,
      arguments: [
        tx.object(MARKETPLACE_ID),
        tx.pure.address(previousBidder),
        tx.pure.u64(refundMist),
      ],
    });
  }
  
  return tx;
}

/**
 * Build PTB: End Auction with NFT transfer and fund distribution
 * 
 * Flow:
 * 1. marketplace::end_auction() - marks as sold
 * 2. Transfer NFT to winner
 * 3. Transfer fees to platform
 * 4. Transfer remaining to seller
 */
export async function buildEndAuctionPTB(
  listingId: string,
  nftObjectId: string,
  sellerAddress: string,
  feeAddress: string,
  feePercent: number,
): Promise<Transaction> {
  const tx = new Transaction();
  
  // Step 1: End auction
  tx.moveCall({
    target: `${PACKAGE_IDS.testnet}::marketplace::end_auction`,
    arguments: [
      tx.object(MARKETPLACE_ID),
      tx.pure.id(listingId),
    ],
  });
  
  // Step 2: Transfer NFT to winner (winner determined by contract state)
  // This is a placeholder - in real implementation, you'd get winner from events
  // tx.transferObjects([tx.object(nftObjectId)], tx.pure.address(winner));
  
  // Step 3: Withdraw funds for seller (minus fees)
  // Seller calls withdraw_funds separately
  
  return tx;
}

/**
 * Build PTB: Buy at Fixed Price
 * 
 * Flow:
 * 1. Split coin for payment
 * 2. marketplace::buy_fixed(coin) - handles fee transfer
 * 3. Transfer NFT to buyer
 */
export async function buildBuyFixedPTB(
  listingId: string,
  priceSui: number,
  nftObjectId?: string,
): Promise<Transaction> {
  const tx = new Transaction();
  const priceMist = BigInt(priceSui) * MIST_PER_SUI;
  
  // Step 1: Split payment
  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)]);
  
  // Step 2: Buy at fixed price
  tx.moveCall({
    target: `${PACKAGE_IDS.testnet}::marketplace::buy_fixed`,
    arguments: [
      tx.object(MARKETPLACE_ID),
      tx.pure.id(listingId),
      payment,
    ],
  });
  
  return tx;
}

/**
 * Build PTB: Create Auction Listing
 */
export async function buildCreateAuctionPTB(
  startupId: string,
  name: string,
  description: string,
  startingPriceSui: number,
  durationEpochs: number,
): Promise<Transaction> {
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
  
  return tx;
}

/**
 * Build PTB: Create Fixed Price Listing
 */
export async function buildCreateFixedPricePTB(
  startupId: string,
  name: string,
  description: string,
  priceSui: number,
): Promise<Transaction> {
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
  
  return tx;
}

/**
 * Build PTB: Withdraw Funds
 */
export async function buildWithdrawPTB(
  amountSui: number,
): Promise<Transaction> {
  const tx = new Transaction();
  const amountMist = BigInt(amountSui) * MIST_PER_SUI;
  
  tx.moveCall({
    target: `${PACKAGE_IDS.testnet}::marketplace::withdraw_funds`,
    arguments: [
      tx.object(MARKETPLACE_ID),
      tx.pure.u64(amountMist),
    ],
  });
  
  return tx;
}

/**
 * Build PTB: Deposit Funds
 */
export async function buildDepositPTB(
  amountSui: number,
): Promise<Transaction> {
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
  
  return tx;
}

// ============ Marketplace Queries ============

/**
 * Get listing details from contract
 */
export async function getListing(listingId: string) {
  // Query listing details - would be implemented with actual RPC calls
  // This is a placeholder that returns null until real deployment
  return null;
}
