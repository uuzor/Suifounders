/**
 * TypeScript types for Startup Fund smart contracts
 */

// ============ Startup Registry Types ============

export interface Startup {
  id: string;
  owner: string;
  name: string;
  description: string;
  whitepaper_blob_id: string;
  pitch_deck_blob_id: string;
  status: StartupStatus;
  trial_start_epoch: number;
  total_shares: number;
  created_at: number;
}

export enum StartupStatus {
  PENDING = 0,
  TRIAL = 1,
  ACTIVE = 2,
  REJECTED = 3,
}

export interface StartupRegisteredEvent {
  startup_id: string;
  owner: string;
  name: string;
  whitepaper_blob_id: string;
  pitch_deck_blob_id: string;
}

export interface StartupOwnerCap {
  id: string;
  startup_id: string;
}

// ============ Revenue Token Types ============

export interface RevenueTokenMetadata {
  id: string;
  startup_id: string;
  max_supply: number;
  current_supply: number;
}

// ============ Funding Pool Types ============

export interface FundingPool {
  id: string;
  startup_id: string;
  owner: string;
  min_raise: number;
  max_raise: number;
  total_raised: number;
  total_tokens: number;
  total_released: number;
  is_open: boolean;
  initial_claimed: boolean;
  governance_id: string | null;
  revenue_token_id: string;
}

export interface InvestorPosition {
  invested_amount: number;
  tokens_owned: number;
  has_withdrawn: boolean;
}

// ============ Governance Types ============

export interface Governance {
  id: string;
  startup_id: string;
  funding_pool_id: string;
  revenue_token_id: string;
  min_proposal_threshold: number;
  min_voting_threshold: number;
  voting_period_epochs: number;
  proposal_count: number;
}

export interface Proposal {
  id: string;
  governance_id: string;
  proposal_type: ProposalType;
  proposer: string;
  recipient: string;
  amount: number;
  title: string;
  description: string;
  votes_for: number;
  votes_against: number;
  total_voting_power: number;
  status: ProposalStatus;
  created_at: number;
  voting_starts: number;
  voting_ends: number;
  executed: boolean;
}

export enum ProposalType {
  TOKEN_RELEASE = 0,
  GENERAL = 1,
  EMERGENCY = 2,
  PARTNERSHIP = 3,
}

export enum ProposalStatus {
  PENDING = 0,
  ACTIVE = 1,
  PASSED = 2,
  REJECTED = 3,
  EXECUTED = 4,
  CANCELLED = 5,
}

export interface Vote {
  voter: string;
  proposal_id: string;
  support: boolean;
  voting_power: number;
  timestamp: number;
}

// ============ Marketplace Types ============

export interface TokenMarketplace {
  id: string;
  fee_percent: number;
  fee_address: string;
  listing_count: number;
  total_volume: number;
}

export interface Listing {
  id: string;
  startup_id: string;
  seller: string;
  token_ids: string[];
  quantity: number;
  price_per_token: number;
  total_price: number;
  listing_type: ListingType;
  created_at: number;
  expires_at: number;
  highest_bid: number;
  highest_bidder: string | null;
  status: ListingStatus;
}

export enum ListingType {
  FIXED_PRICE = 0,
  AUCTION = 1,
  OFFER = 2,
}

export enum ListingStatus {
  ACTIVE = 0,
  SOLD = 1,
  CANCELLED = 2,
  EXPIRED = 3,
}

export interface Offer {
  id: string;
  startup_id: string;
  buyer: string;
  token_owner: string;
  price_per_token: number;
  quantity: number;
  total_price: number;
  expires_at: number;
  status: ListingStatus;
}

// ============ API Response Types ============

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface OnChainData {
  startups: Startup[];
  totalStartups: number;
}

// ============ Transaction Types ============

export interface TransactionResult {
  digest: string;
  success: boolean;
  error?: string;
}

export interface InvestmentAmount {
  amount: number; // in MIST
  suiAmount: number; // in SUI (for display)
}

// ============ Form Types ============

export interface RegisterStartupForm {
  name: string;
  description: string;
  whitepaper_blob_id: string;
  pitch_deck_blob_id?: string;
}

export interface CreateProposalForm {
  title: string;
  description: string;
  recipient?: string;
  amount?: number;
  proposalType: ProposalType;
}

export interface CreateListingForm {
  startup_id: string;
  quantity: number;
  price_per_token: number;
  listing_type: ListingType;
  duration_epochs?: number;
}
