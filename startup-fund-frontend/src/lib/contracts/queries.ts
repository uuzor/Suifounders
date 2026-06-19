/**
 * On-chain data queries for Startup Fund smart contracts
 */

import { useCurrentClient, useCurrentAccount } from '@mysten/dapp-kit-react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { PACKAGE_IDS } from '../dapp-kit';
import type { 
  Startup, 
  FundingPool, 
  Governance, 
  Proposal,
  TokenMarketplace,
  Listing,
  InvestorPosition 
} from './types';

// Helper to convert bigint to number
const bigIntToNumber = (value: bigint | number | string): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10);
  return Number(value);
};

// ============ Startup Registry Queries ============

/**
 * Get the StartupRegistry object
 */
export function useStartupRegistry(registryId: string) {
  const client = useCurrentClient();
  const account = useCurrentAccount();

  return useQuery({
    queryKey: ['startup-registry', registryId],
    queryFn: async () => {
      const result = await client.core.getObject({
        id: registryId,
        options: { showContent: true, showType: true },
      });
      return result;
    },
    enabled: !!registryId && !!account,
  });
}

/**
 * Get all startups from the registry
 */
export function useAllStartups(registryId: string) {
  const client = useCurrentClient();

  return useInfiniteQuery({
    queryKey: ['all-startups', registryId],
    queryFn: async ({ pageParam }) => {
      const packageId = PACKAGE_IDS['testnet'];
      
      // Query for events to get all startup registrations
      const events = await client.core.queryEvents({
        query: { 
          MoveModule: {
            module: 'startup_registry',
            package: packageId,
          }
        },
        cursor: pageParam,
        limit: 50,
      });

      return {
        events: events.data,
        nextCursor: events.nextCursor,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!registryId,
  });
}

/**
 * Get a single startup by ID
 */
export function useStartup(startupId: string | null) {
  const client = useCurrentClient();

  return useQuery({
    queryKey: ['startup', startupId],
    queryFn: async () => {
      if (!startupId) return null;

      const result = await client.core.getObject({
        id: startupId,
        options: { showContent: true, showType: true, showOwner: true },
      });

      if (!result.data) return null;

      // Parse the Startup struct
      const content = result.data.content;
      if (content?.dataType === 'moveObject') {
        const fields = content.fields as Record<string, unknown>;
        return {
          id: result.data.objectId,
          owner: (fields.owner as string) || (fields.owner as { owner: string })?.owner,
          name: fields.name as string,
          description: fields.description as string,
          whitepaper_blob_id: fields.whitepaper_blob_id as string,
          pitch_deck_blob_id: fields.pitch_deck_blob_id as string,
          status: bigIntToNumber(fields.status as bigint),
          trial_start_epoch: bigIntToNumber(fields.trial_start_epoch as bigint),
          total_shares: bigIntToNumber(fields.total_shares as bigint),
          created_at: bigIntToNumber(fields.created_at as bigint),
        } as Startup;
      }

      return null;
    },
    enabled: !!startupId,
  });
}

/**
 * Get startups owned by the current account
 */
export function useMyStartups(registryId: string) {
  const client = useCurrentClient();
  const account = useCurrentAccount();

  return useQuery({
    queryKey: ['my-startups', account?.address, registryId],
    queryFn: async () => {
      if (!account?.address || !registryId) return [];

      const packageId = PACKAGE_IDS['testnet'];

      // Query events for startups owned by this address
      const events = await client.core.queryEvents({
        query: {
          MoveEventType: {
            module: 'startup_registry',
            name: 'StartupRegistered',
          }
        },
      });

      // Filter events by owner
      const myEvents = events.data.filter((event) => {
        const parsed = event.parsed_json as { owner: string };
        return parsed?.owner === account.address;
      });

      // Fetch full startup objects
      const startups: Startup[] = [];
      for (const event of myEvents) {
        const startupId = event.parsed_json?.startup_id;
        if (startupId) {
          const startup = await fetchStartup(client, startupId);
          if (startup) startups.push(startup);
        }
      }

      return startups;
    },
    enabled: !!account?.address && !!registryId,
  });
}

// ============ Funding Pool Queries ============

/**
 * Get a funding pool by ID
 */
export function useFundingPool(poolId: string | null) {
  const client = useCurrentClient();

  return useQuery({
    queryKey: ['funding-pool', poolId],
    queryFn: async () => {
      if (!poolId) return null;
      return fetchFundingPool(client, poolId);
    },
    enabled: !!poolId,
  });
}

/**
 * Get all funding pools for a startup
 */
export function useStartupFundingPool(startupId: string | null) {
  const client = useCurrentClient();

  return useQuery({
    queryKey: ['startup-funding-pool', startupId],
    queryFn: async () => {
      if (!startupId) return null;

      // Query events to find the funding pool
      const events = await client.core.queryEvents({
        query: {
          MoveEventType: {
            module: 'funding_pool',
            name: 'FundingPoolCreated',
          }
        },
      });

      // Find pool for this startup
      for (const event of events.data) {
        const parsed = event.parsed_json as { startup_id: string; pool_id: string };
        if (parsed?.startup_id === startupId) {
          return fetchFundingPool(client, parsed.pool_id);
        }
      }

      return null;
    },
    enabled: !!startupId,
  });
}

/**
 * Get investor position in a funding pool
 */
export function useInvestorPosition(poolId: string | null) {
  const client = useCurrentClient();
  const account = useCurrentAccount();

  return useQuery({
    queryKey: ['investor-position', poolId, account?.address],
    queryFn: async () => {
      if (!poolId || !account?.address) return null;

      // Query for deposit events to find position
      const events = await client.core.queryEvents({
        query: {
          MoveEventType: {
            module: 'funding_pool',
            name: 'Deposited',
          }
        },
      });

      for (const event of events.data) {
        const parsed = event.parsed_json as { investor: string; pool_id: string; amount: string };
        if (parsed?.investor === account.address && parsed?.pool_id === poolId) {
          return {
            invested_amount: bigIntToNumber(parsed.amount),
            tokens_owned: bigIntToNumber(parsed.amount), // 1:1 ratio
            has_withdrawn: false,
          } as InvestorPosition;
        }
      }

      return null;
    },
    enabled: !!poolId && !!account?.address,
  });
}

// ============ Governance Queries ============

/**
 * Get governance contract for a startup
 */
export function useGovernance(startupId: string | null) {
  const client = useCurrentClient();

  return useQuery({
    queryKey: ['governance', startupId],
    queryFn: async () => {
      if (!startupId) return null;

      // Query events to find governance
      const events = await client.core.queryEvents({
        query: {
          MoveEventType: {
            module: 'governance',
            name: 'GovernanceCreated',
          }
        },
      });

      for (const event of events.data) {
        const parsed = event.parsed_json as { startup_id: string; governance_id: string };
        if (parsed?.startup_id === startupId) {
          return fetchGovernance(client, parsed.governance_id);
        }
      }

      return null;
    },
    enabled: !!startupId,
  });
}

/**
 * Get all proposals for a governance contract
 */
export function useProposals(governanceId: string | null) {
  const client = useCurrentClient();

  return useInfiniteQuery({
    queryKey: ['proposals', governanceId],
    queryFn: async ({ pageParam }) => {
      if (!governanceId) return { proposals: [], nextCursor: null };

      const events = await client.core.queryEvents({
        query: {
          MoveEventType: {
            module: 'governance',
            name: 'ProposalCreated',
          }
        },
        cursor: pageParam,
        limit: 20,
      });

      const proposals: Proposal[] = [];
      for (const event of events.data) {
        const parsed = event.parsed_json as { governance_id: string };
        if (parsed?.governance_id === governanceId) {
          const proposal = await fetchProposal(client, event.id);
          if (proposal) proposals.push(proposal);
        }
      }

      return {
        proposals,
        nextCursor: events.nextCursor,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!governanceId,
  });
}

/**
 * Get active proposals only
 */
export function useActiveProposals(governanceId: string | null) {
  const { data, ...rest } = useProposals(governanceId);
  
  return {
    ...rest,
    data: data?.pages.flatMap(p => p.proposals).filter(p => p.status === 1), // ACTIVE
  };
}

// ============ Marketplace Queries ============

/**
 * Get the marketplace object
 */
export function useMarketplace(marketplaceId: string | null) {
  const client = useCurrentClient();

  return useQuery({
    queryKey: ['marketplace', marketplaceId],
    queryFn: async () => {
      if (!marketplaceId) return null;

      const result = await client.core.getObject({
        id: marketplaceId,
        options: { showContent: true },
      });

      if (!result.data?.content) return null;

      const content = result.data.content;
      if (content.dataType === 'moveObject') {
        const fields = content.fields as Record<string, unknown>;
        return {
          id: result.data.objectId,
          fee_percent: bigIntToNumber(fields.fee_percent as bigint),
          fee_address: fields.fee_address as string,
          listing_count: bigIntToNumber(fields.listing_count as bigint),
          total_volume: bigIntToNumber(fields.total_volume as bigint),
        } as TokenMarketplace;
      }

      return null;
    },
    enabled: !!marketplaceId,
  });
}

/**
 * Get all active listings
 */
export function useActiveListings(marketplaceId: string | null) {
  const client = useCurrentClient();

  return useInfiniteQuery({
    queryKey: ['active-listings', marketplaceId],
    queryFn: async ({ pageParam }) => {
      if (!marketplaceId) return { listings: [], nextCursor: null };

      const events = await client.core.queryEvents({
        query: {
          MoveEventType: {
            module: 'token_marketplace',
            name: 'ListingCreated',
          }
        },
        cursor: pageParam,
        limit: 20,
      });

      const listings: Listing[] = [];
      for (const event of events.data) {
        const parsed = event.parsed_json as Record<string, unknown>;
        listings.push({
          id: event.id,
          startup_id: parsed.startup_id as string,
          seller: parsed.seller as string,
          token_ids: parsed.token_ids as string[] || [],
          quantity: bigIntToNumber(parsed.quantity as bigint),
          price_per_token: bigIntToNumber(parsed.price_per_token as bigint),
          total_price: bigIntToNumber(parsed.total_price as bigint),
          listing_type: bigIntToNumber(parsed.listing_type as bigint),
          created_at: bigIntToNumber(parsed.created_at as bigint),
          expires_at: bigIntToNumber(parsed.expires_at as bigint),
          highest_bid: 0,
          highest_bidder: null,
          status: 0, // ACTIVE
        });
      }

      return {
        listings,
        nextCursor: events.nextCursor,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!marketplaceId,
  });
}

// ============ Balance Queries ============

/**
 * Get user's SUI balance
 */
export function useSuiBalance() {
  const client = useCurrentClient();
  const account = useCurrentAccount();

  return useQuery({
    queryKey: ['sui-balance', account?.address],
    queryFn: async () => {
      if (!account?.address) return 0;

      const coins = await client.core.getCoins({
        owner: account.address,
        coinType: '0x2::sui::SUI',
      });

      const total = coins.data.reduce((sum, coin) => {
        return sum + bigIntToNumber(coin.balance);
      }, 0);

      return total;
    },
    enabled: !!account?.address,
  });
}

/**
 * Get user's revenue tokens for a startup
 */
export function useRevenueTokens(startupId: string | null) {
  const client = useCurrentClient();
  const account = useCurrentAccount();
  const packageId = PACKAGE_IDS['testnet'];

  return useQuery({
    queryKey: ['revenue-tokens', account?.address, startupId],
    queryFn: async () => {
      if (!account?.address || !startupId) return 0;

      // Query owned objects for revenue tokens
      const objects = await client.core.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${packageId}::revenue_token::RevenueToken`
        },
      });

      // Sum up all tokens for this startup
      let total = 0;
      for (const obj of objects.data) {
        if (obj.data?.content?.dataType === 'moveObject') {
          const fields = obj.data.content.fields as Record<string, unknown>;
          // Count tokens (simplified - actual implementation would need proper parsing)
          total += bigIntToNumber(fields.value as bigint || 0);
        }
      }

      return total;
    },
    enabled: !!account?.address && !!startupId,
  });
}

// ============ Helper Functions ============

async function fetchStartup(client: ReturnType<typeof useCurrentClient>, startupId: string): Promise<Startup | null> {
  try {
    const result = await client.core.getObject({
      id: startupId,
      options: { showContent: true },
    });

    if (!result.data?.content || result.data.content.dataType !== 'moveObject') {
      return null;
    }

    const fields = result.data.content.fields as Record<string, unknown>;
    return {
      id: result.data.objectId,
      owner: fields.owner as string,
      name: fields.name as string,
      description: fields.description as string,
      whitepaper_blob_id: fields.whitepaper_blob_id as string,
      pitch_deck_blob_id: fields.pitch_deck_blob_id as string,
      status: bigIntToNumber(fields.status as bigint),
      trial_start_epoch: bigIntToNumber(fields.trial_start_epoch as bigint),
      total_shares: bigIntToNumber(fields.total_shares as bigint),
      created_at: bigIntToNumber(fields.created_at as bigint),
    };
  } catch {
    return null;
  }
}

async function fetchFundingPool(client: ReturnType<typeof useCurrentClient>, poolId: string): Promise<FundingPool | null> {
  try {
    const result = await client.core.getObject({
      id: poolId,
      options: { showContent: true },
    });

    if (!result.data?.content || result.data.content.dataType !== 'moveObject') {
      return null;
    }

    const fields = result.data.content.fields as Record<string, unknown>;
    const governanceId = fields.governance_id as { vec: [{ fields: { id: string } }] } | null;
    
    return {
      id: result.data.objectId,
      startup_id: fields.startup_id as string,
      owner: fields.owner as string,
      min_raise: bigIntToNumber(fields.min_raise as bigint),
      max_raise: bigIntToNumber(fields.max_raise as bigint),
      total_raised: bigIntToNumber((fields.total_raised as { value: bigint }).value),
      total_tokens: bigIntToNumber(fields.total_tokens as bigint),
      total_released: bigIntToNumber(fields.total_released as bigint),
      is_open: fields.is_open as boolean,
      initial_claimed: fields.initial_claimed as boolean,
      governance_id: governanceId?.vec?.[0]?.fields?.id || null,
      revenue_token_id: fields.revenue_token_id as string,
    };
  } catch {
    return null;
  }
}

async function fetchGovernance(client: ReturnType<typeof useCurrentClient>, governanceId: string): Promise<Governance | null> {
  try {
    const result = await client.core.getObject({
      id: governanceId,
      options: { showContent: true },
    });

    if (!result.data?.content || result.data.content.dataType !== 'moveObject') {
      return null;
    }

    const fields = result.data.content.fields as Record<string, unknown>;
    return {
      id: result.data.objectId,
      startup_id: fields.startup_id as string,
      funding_pool_id: fields.funding_pool_id as string,
      revenue_token_id: fields.revenue_token_id as string,
      min_proposal_threshold: bigIntToNumber(fields.min_proposal_threshold as bigint),
      min_voting_threshold: bigIntToNumber(fields.min_voting_threshold as bigint),
      voting_period_epochs: bigIntToNumber(fields.voting_period_epochs as bigint),
      proposal_count: bigIntToNumber(fields.proposal_count as bigint),
    };
  } catch {
    return null;
  }
}

async function fetchProposal(client: ReturnType<typeof useCurrentClient>, proposalId: string): Promise<Proposal | null> {
  try {
    const result = await client.core.getObject({
      id: proposalId,
      options: { showContent: true },
    });

    if (!result.data?.content || result.data.content.dataType !== 'moveObject') {
      return null;
    }

    const fields = result.data.content.fields as Record<string, unknown>;
    return {
      id: result.data.objectId,
      governance_id: fields.governance_id as string,
      proposal_type: bigIntToNumber(fields.proposal_type as bigint),
      proposer: fields.proposer as string,
      recipient: fields.recipient as string,
      amount: bigIntToNumber(fields.amount as bigint),
      title: fields.title as string,
      description: fields.description as string,
      votes_for: bigIntToNumber(fields.votes_for as bigint),
      votes_against: bigIntToNumber(fields.votes_against as bigint),
      total_voting_power: bigIntToNumber(fields.total_voting_power as bigint),
      status: bigIntToNumber(fields.status as bigint),
      created_at: bigIntToNumber(fields.created_at as bigint),
      voting_starts: bigIntToNumber(fields.voting_starts as bigint),
      voting_ends: bigIntToNumber(fields.voting_ends as bigint),
      executed: fields.executed as boolean,
    };
  } catch {
    return null;
  }
}
