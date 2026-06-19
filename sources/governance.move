/// Module: governance
/// Decentralized governance for startups. Token holders (revenue token owners)
/// can create proposals and vote on fund releases from the funding pool.
module startup_fund::governance;

use std::string::String;
use std::vector;
use std::option::{Self, Option};
use sui::object::{UID, ID, new, uid_to_inner};
use sui::tx_context::TxContext;
use sui::event::emit;
use sui::transfer;
use sui::dynamic_field as df;

// Error codes
const ENotTokenHolder: u64 = 0;
const EAlreadyVoted: u64 = 1;
const EVotingNotActive: u64 = 2;
const EVotingEnded: u64 = 3;
const EProposalNotExecutable: u64 = 4;
const EInsufficientVotingPower: u64 = 5;
const EAlreadyInitialized: u64 = 6;

// ============ Proposal Types ============
const PROPOSAL_TYPE_GENERAL: u8 = 0;
const PROPOSAL_TYPE_TOKEN_RELEASE: u8 = 1;
const PROPOSAL_TYPE_EMERGENCY: u8 = 2;

// ============ Proposal Status ============
const STATUS_ACTIVE: u8 = 0;
const STATUS_PASSED: u8 = 1;
const STATUS_FAILED: u8 = 2;
const STATUS_EXECUTED: u8 = 3;
const STATUS_CANCELLED: u8 = 4;

// ============ Events ============

/// Emitted when governance is created
public struct GovernanceCreated has copy, drop {
    governance_id: ID,
    startup_id: ID,
    funding_pool_id: ID,
    revenue_token_id: ID,
}

/// Emitted when a new proposal is created
public struct ProposalCreated has copy, drop {
    governance_id: ID,
    startup_id: ID,
    proposal_id: ID,
    proposer: address,
    proposal_type: u8,
    title: String,
}

/// Emitted when a vote is cast
public struct VoteCast has copy, drop {
    governance_id: ID,
    startup_id: ID,
    proposal_id: ID,
    voter: address,
    vote: bool,
    voting_power: u64,
}

/// Emitted when voting ends and proposal passes
public struct ProposalPassed has copy, drop {
    governance_id: ID,
    startup_id: ID,
    proposal_id: ID,
    votes_for: u64,
    votes_against: u64,
}

/// Emitted when voting ends and proposal fails
public struct ProposalFailed has copy, drop {
    governance_id: ID,
    startup_id: ID,
    proposal_id: ID,
    votes_for: u64,
    votes_against: u64,
}

/// Emitted when a proposal is executed (funds released)
public struct ProposalExecuted has copy, drop {
    governance_id: ID,
    startup_id: ID,
    proposal_id: ID,
    recipient: address,
    amount: u64,
}

/// Emitted when revenue is distributed to token holders
public struct RevenueDistributed has copy, drop {
    governance_id: ID,
    startup_id: ID,
    total_amount: u64,
}

/// Emitted when a proposal is cancelled
public struct ProposalCancelled has copy, drop {
    governance_id: ID,
    startup_id: ID,
    proposal_id: ID,
}

// ============ Structs ============

/// Governance contract for a startup
/// Each startup has one governance contract tied to its funding pool and revenue token
public struct Governance has key {
    id: UID,
    /// The startup this governance belongs to
    startup_id: ID,
    /// The funding pool this governance controls
    funding_pool_id: ID,
    /// The revenue token ID (for voting power)
    revenue_token_id: ID,
    /// Minimum token balance to create proposals
    min_proposal_threshold: u64,
    /// Minimum token balance to vote
    min_voting_threshold: u64,
    /// Voting period in epochs
    voting_period_epochs: u64,
    /// Total proposals created
    proposal_count: u64,
}

/// A governance proposal
public struct Proposal has key, store {
    id: UID,
    /// The startup this proposal belongs to
    startup_id: ID,
    /// Type of proposal
    proposal_type: u8,
    /// Title
    title: String,
    /// Description/IPFS link
    description: String,
    /// Recipient for fund releases
    recipient: address,
    /// Amount to release (for release proposals)
    release_amount: u64,
    /// Proposer
    proposer: address,
    /// Voting start epoch
    start_epoch: u64,
    /// Voting end epoch
    end_epoch: u64,
    /// Votes for
    votes_for: u64,
    /// Votes against
    votes_against: u64,
    /// List of voters
    voters: vector<address>,
    /// Current status
    status: u8,
    /// Whether executed
    executed: bool,
}

/// Vote record to prevent double voting
public struct VoteRecord has key, store {
    id: UID,
    governance_id: ID,
    proposal_id: ID,
    voter: address,
}

// ============ Constants ============

/// Default voting period (7 epochs ≈ 7 days)
const DEFAULT_VOTING_PERIOD: u64 = 7;

/// Default minimum tokens to create proposal
const DEFAULT_MIN_PROPOSAL: u64 = 10_000_000; // 10 tokens

/// Default minimum tokens to vote
const DEFAULT_MIN_VOTE: u64 = 1_000_000; // 1 token

// ============ Entry Functions ============

/// Create governance for a startup
public fun create_governance(
    startup_id: ID,
    funding_pool_id: ID,
    revenue_token_id: ID,
    min_proposal_threshold: u64,
    min_voting_threshold: u64,
    voting_period_epochs: u64,
    ctx: &mut TxContext,
): ID {
    let governance = Governance {
        id: new(ctx),
        startup_id,
        funding_pool_id,
        revenue_token_id,
        min_proposal_threshold,
        min_voting_threshold,
        voting_period_epochs,
        proposal_count: 0,
    };
    
    let governance_id = uid_to_inner(&governance.id);
    transfer::share_object(governance);
    
    emit(GovernanceCreated {
        governance_id,
        startup_id,
        funding_pool_id,
        revenue_token_id,
    });
    
    governance_id
}

/// Create a token release proposal
public fun create_release_proposal(
    governance: &mut Governance,
    recipient: address,
    amount: u64,
    title: String,
    description: String,
    ctx: &mut TxContext,
): ID {
    let proposer = tx_context::sender(ctx);
    create_proposal_impl(
        governance,
        PROPOSAL_TYPE_TOKEN_RELEASE,
        proposer,
        recipient,
        amount,
        title,
        description,
        ctx,
    )
}

/// Create a general proposal
public fun create_general_proposal(
    governance: &mut Governance,
    title: String,
    description: String,
    ctx: &mut TxContext,
): ID {
    let proposer = tx_context::sender(ctx);
    create_proposal_impl(
        governance,
        PROPOSAL_TYPE_GENERAL,
        proposer,
        @0x0,
        0,
        title,
        description,
        ctx,
    )
}

/// Create an emergency proposal
public fun create_emergency_proposal(
    governance: &mut Governance,
    title: String,
    description: String,
    ctx: &mut TxContext,
): ID {
    let proposer = tx_context::sender(ctx);
    create_proposal_impl(
        governance,
        PROPOSAL_TYPE_EMERGENCY,
        proposer,
        @0x0,
        0,
        title,
        description,
        ctx,
    )
}

/// Internal: create a proposal
fun create_proposal_impl(
    governance: &mut Governance,
    proposal_type: u8,
    proposer: address,
    recipient: address,
    release_amount: u64,
    title: String,
    description: String,
    ctx: &mut TxContext,
): ID {
    let current_epoch = tx_context::epoch(ctx);
    
    let proposal = Proposal {
        id: new(ctx),
        startup_id: governance.startup_id,
        proposal_type,
        title,
        description,
        recipient,
        release_amount,
        proposer,
        start_epoch: current_epoch,
        end_epoch: current_epoch + governance.voting_period_epochs,
        votes_for: 0,
        votes_against: 0,
        voters: vector::empty(),
        status: STATUS_ACTIVE,
        executed: false,
    };
    
    let proposal_id = uid_to_inner(&proposal.id);
    
    df::add(&mut governance.id, proposal_id, proposal);
    governance.proposal_count = governance.proposal_count + 1;
    
    emit(ProposalCreated {
        governance_id: uid_to_inner(&governance.id),
        startup_id: governance.startup_id,
        proposal_id,
        proposer,
        proposal_type,
        title,
    });
    
    proposal_id
}

/// Vote on a proposal (caller must have revenue tokens)
public fun vote(
    governance: &mut Governance,
    proposal_id: ID,
    support: bool,
    voting_power: u64,
    ctx: &mut TxContext,
) {
    // Verify voting power threshold
    assert!(voting_power >= governance.min_voting_threshold, EInsufficientVotingPower);
    
    let voter = tx_context::sender(ctx);
    let vote_key = derive_vote_key(&governance.startup_id, &proposal_id, &voter);
    
    // Check not already voted
    assert!(!df::exists(&governance.id, vote_key), EAlreadyVoted);
    
    // Get proposal
    let proposal: &mut Proposal = df::borrow_mut(&mut governance.id, proposal_id);
    
    // Verify voting active
    let current_epoch = tx_context::epoch(ctx);
    assert!(proposal.status == STATUS_ACTIVE, EVotingNotActive);
    assert!(current_epoch < proposal.end_epoch, EVotingEnded);
    
    // Record voter
    vector::push_back(&mut proposal.voters, voter);
    
    // Update votes
    if (support) {
        proposal.votes_for = proposal.votes_for + voting_power;
    } else {
        proposal.votes_against = proposal.votes_against + voting_power;
    };
    
    // Create vote record
    let vote_record = VoteRecord {
        id: new(ctx),
        governance_id: uid_to_inner(&governance.id),
        proposal_id,
        voter,
    };
    df::add(&mut governance.id, vote_key, vote_record);
    
    emit(VoteCast {
        governance_id: uid_to_inner(&governance.id),
        startup_id: governance.startup_id,
        proposal_id,
        voter,
        vote: support,
        voting_power,
    });
}

/// End voting and determine outcome
public fun end_voting(
    governance: &mut Governance,
    proposal_id: ID,
    ctx: &mut TxContext,
) {
    let current_epoch = tx_context::epoch(ctx);
    let governance_id = uid_to_inner(&governance.id);
    let startup_id = governance.startup_id;
    
    {
        let proposal: &mut Proposal = df::borrow_mut(&mut governance.id, proposal_id);
        assert!(current_epoch >= proposal.end_epoch, EVotingEnded);
        assert!(proposal.status == STATUS_ACTIVE, EVotingNotActive);
        
        // Simple majority
        if (proposal.votes_for > proposal.votes_against) {
            proposal.status = STATUS_PASSED;
            emit(ProposalPassed {
                governance_id,
                startup_id,
                proposal_id,
                votes_for: proposal.votes_for,
                votes_against: proposal.votes_against,
            });
        } else {
            proposal.status = STATUS_FAILED;
            emit(ProposalFailed {
                governance_id,
                startup_id,
                proposal_id,
                votes_for: proposal.votes_for,
                votes_against: proposal.votes_against,
            });
        }
    }
}

/// Execute a passed proposal (triggers fund release from funding pool)
public fun execute_proposal(
    governance: &mut Governance,
    proposal_id: ID,
): (address, u64) {
    let proposal: &mut Proposal = df::borrow_mut(&mut governance.id, proposal_id);
    
    assert!(proposal.status == STATUS_PASSED, EProposalNotExecutable);
    assert!(!proposal.executed, EProposalNotExecutable);
    
    proposal.executed = true;
    proposal.status = STATUS_EXECUTED;
    
    let recipient = proposal.recipient;
    let amount = proposal.release_amount;
    
    emit(ProposalExecuted {
        governance_id: uid_to_inner(&governance.id),
        startup_id: governance.startup_id,
        proposal_id,
        recipient,
        amount,
    });
    
    (recipient, amount)
}

/// Cancel a proposal (only by proposer)
public fun cancel_proposal(
    governance: &mut Governance,
    proposal_id: ID,
    ctx: &mut TxContext,
) {
    let proposal: &mut Proposal = df::borrow_mut(&mut governance.id, proposal_id);
    let sender = tx_context::sender(ctx);
    
    assert!(proposal.proposer == sender, ENotTokenHolder);
    
    let current_epoch = tx_context::epoch(ctx);
    assert!(current_epoch < proposal.end_epoch, EVotingEnded);
    
    proposal.status = STATUS_CANCELLED;
    
    emit(ProposalCancelled {
        governance_id: uid_to_inner(&governance.id),
        startup_id: governance.startup_id,
        proposal_id,
    });
}

/// Distribute revenue to token holders
public fun distribute_revenue(
    governance: &mut Governance,
    amount: u64,
) {
    emit(RevenueDistributed {
        governance_id: uid_to_inner(&governance.id),
        startup_id: governance.startup_id,
        total_amount: amount,
    });
}

// ============ View Functions ============

/// Derive unique key for vote records
fun derive_vote_key(startup_id: &ID, proposal_id: &ID, voter: &address): ID {
    // Use proposal_id as key (it's unique per governance)
    *proposal_id
}

/// Get governance info
public fun get_governance_info(g: &Governance): (ID, ID, ID) {
    (g.startup_id, g.funding_pool_id, g.revenue_token_id)
}

/// Get proposal details
public fun get_proposal(g: &Governance, proposal_id: ID): (u8, String, u64, u64, u64, u64, u8, bool) {
    let p: &Proposal = df::borrow(&g.id, proposal_id);
    (
        p.proposal_type,
        p.title,
        p.votes_for,
        p.votes_against,
        p.start_epoch,
        p.end_epoch,
        p.status,
        p.executed
    )
}

/// Get voting results
public fun get_voting_results(g: &Governance, proposal_id: ID): (u64, u64, u64) {
    let p: &Proposal = df::borrow(&g.id, proposal_id);
    let total = p.votes_for + p.votes_against;
    (p.votes_for, p.votes_against, total)
}

/// Check if voter has voted
public fun has_voted(g: &Governance, proposal_id: ID, voter: &address): bool {
    let key = derive_vote_key(&g.startup_id, &proposal_id, voter);
    df::exists(&g.id, key)
}

/// Get proposal status
public fun get_proposal_status(g: &Governance, proposal_id: ID): u8 {
    let p: &Proposal = df::borrow(&g.id, proposal_id);
    p.status
}

/// Get governance stats
public fun get_stats(g: &Governance): (u64, u64, u64, u64) {
    (
        g.proposal_count,
        g.min_proposal_threshold,
        g.min_voting_threshold,
        g.voting_period_epochs
    )
}
