/// Module: funding_pool
/// A decentralized funding pool per startup. Investors lock SUI to receive
/// revenue tokens (equity shares). Token holders can vote on governance proposals
/// that control fund releases.
module startup_fund::funding_pool;

use std::option::{Self, Option};
use sui::object::{UID, ID, new, uid_to_inner, id_from_address};
use sui::tx_context::TxContext;
use sui::event::emit;
use sui::transfer;
use sui::coin::{Self, Coin};
use sui::balance::{Self, Balance};
use sui::sui::SUI;
use sui::dynamic_field as df;

// Error codes
const ENotOwner: u64 = 0;
const EInvalidAmount: u64 = 1;
const EInsufficientFunds: u64 = 2;
const EFundingClosed: u64 = 3;
const EAlreadyClaimed: u64 = 4;
const EMinRaiseNotMet: u64 = 5;
const EAlreadyWithdrawn: u64 = 6;
const EReleaseNotApproved: u64 = 7;
const ENoReleasableFunds: u64 = 8;
const EGovernanceAlreadySet: u64 = 9;

// ============ Events ============

/// Emitted when an investor deposits funds into the pool
public struct FundsDeposited has copy, drop {
    pool_id: ID,
    startup_id: ID,
    investor: address,
    amount: u64,
}

/// Emitted when an investor withdraws their funds
public struct FundsWithdrawn has copy, drop {
    pool_id: ID,
    startup_id: ID,
    investor: address,
    amount: u64,
}

/// Emitted when funding goal is met
public struct FundingCompleted has copy, drop {
    pool_id: ID,
    startup_id: ID,
    total_raised: u64,
    revenue_token_supply: u64,
}

/// Emitted when governance is set for this pool
public struct GovernanceSet has copy, drop {
    pool_id: ID,
    startup_id: ID,
    governance_id: ID,
}

/// Emitted when funds are released (governance approved)
public struct FundsReleased has copy, drop {
    pool_id: ID,
    startup_id: ID,
    governance_id: ID,
    recipient: address,
    amount: u64,
}

/// Emitted when pool is closed
public struct PoolClosed has copy, drop {
    pool_id: ID,
    startup_id: ID,
    reason: u8, // 0=completed, 1=withdrawn
}

// ============ Structs ============

/// Represents a funding pool for a specific startup
/// Each startup has its own funding pool
public struct FundingPool has key {
    id: UID,
    /// The startup this pool belongs to
    startup_id: ID,
    /// Minimum amount to raise (in MIST)
    min_raise: u64,
    /// Maximum amount to raise (in MIST)
    max_raise: u64,
    /// Total funds raised so far
    total_raised: Balance<SUI>,
    /// Total revenue tokens minted (1:1 with SUI deposited)
    total_tokens: u64,
    /// Total funds already released to startup
    total_released: u64,
    /// Whether funding is still open
    is_open: bool,
    /// Whether initial funds have been claimed
    initial_claimed: bool,
    /// Owner of the pool (the startup)
    owner: address,
    /// Governance contract ID that controls releases
    governance_id: Option<ID>,
    /// Revenue token treasury cap ID (for voting power lookup)
    revenue_token_id: ID,
}

/// Tracks individual investor positions
public struct InvestorPosition has store, copy {
    invested_amount: u64,
    tokens_owned: u64,
    has_withdrawn: bool,
}

// ============ Constants ============

/// Minimum deposit (1 SUI)
const MIN_DEPOSIT: u64 = 1_000_000_000;

/// Initial release percentage (50%)
const INITIAL_RELEASE_PERCENT: u64 = 5000;

// ============ Entry Functions ============

/// Create a funding pool for a specific startup
public fun create_funding_pool(
    startup_id: ID,
    revenue_token_id: ID,
    min_raise: u64,
    max_raise: u64,
    ctx: &mut TxContext,
): ID {
    let pool = FundingPool {
        id: new(ctx),
        startup_id,
        min_raise,
        max_raise,
        total_raised: balance::zero(),
        total_tokens: 0,
        total_released: 0,
        is_open: true,
        initial_claimed: false,
        owner: tx_context::sender(ctx),
        governance_id: option::none(),
        revenue_token_id,
    };
    
    let pool_id = uid_to_inner(&pool.id);
    transfer::share_object(pool);
    
    emit(GovernanceSet {
        pool_id,
        startup_id,
        governance_id: sui::object::id_from_address(@0x0),
    });
    
    pool_id
}

/// Deposit SUI and receive revenue tokens
public fun deposit(
    pool: &mut FundingPool,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
): u64 {
    assert!(pool.is_open, EFundingClosed);
    
    let amount = coin::value(&payment);
    assert!(amount >= MIN_DEPOSIT, EInvalidAmount);
    
    let investor = tx_context::sender(ctx);
    let position_key = derive_position_key(&pool.startup_id, &investor);
    
    // 1:1 ratio for tokens
    let tokens_to_mint = amount;
    
    // Add funds to pool
    let funds = coin::into_balance(payment);
    balance::join(&mut pool.total_raised, funds);
    
    // Update investor position
    if (df::exists(&pool.id, position_key)) {
        let pos: &mut InvestorPosition = df::borrow_mut(&mut pool.id, position_key);
        pos.invested_amount = pos.invested_amount + amount;
        pos.tokens_owned = pos.tokens_owned + tokens_to_mint;
    } else {
        let position = InvestorPosition {
            invested_amount: amount,
            tokens_owned: tokens_to_mint,
            has_withdrawn: false,
        };
        df::add(&mut pool.id, position_key, position);
    };
    
    pool.total_tokens = pool.total_tokens + tokens_to_mint;
    
    emit(FundsDeposited {
        pool_id: uid_to_inner(&pool.id),
        startup_id: pool.startup_id,
        investor,
        amount,
    });
    
    tokens_to_mint
}

/// Withdraw if funding fails
public fun withdraw(
    pool: &mut FundingPool,
    ctx: &mut TxContext,
): Coin<SUI> {
    let investor = tx_context::sender(ctx);
    let position_key = derive_position_key(&pool.startup_id, &investor);
    
    assert!(df::exists(&pool.id, position_key), EInsufficientFunds);
    
    let position: &mut InvestorPosition = df::borrow_mut(&mut pool.id, position_key);
    assert!(!position.has_withdrawn, EAlreadyWithdrawn);
    
    let withdraw_amount = position.invested_amount;
    position.has_withdrawn = true;
    pool.is_open = false;
    
    emit(FundsWithdrawn {
        pool_id: uid_to_inner(&pool.id),
        startup_id: pool.startup_id,
        investor,
        amount: withdraw_amount,
    });
    
    emit(PoolClosed {
        pool_id: uid_to_inner(&pool.id),
        startup_id: pool.startup_id,
        reason: 1, // withdrawn
    });
    
    let balance = balance::split(&mut pool.total_raised, withdraw_amount);
    coin::from_balance(balance, ctx)
}

/// Claim initial 50% when funding succeeds
public fun claim_initial_funds(
    pool: &mut FundingPool,
    ctx: &mut TxContext,
): Coin<SUI> {
    assert!(tx_context::sender(ctx) == pool.owner, ENotOwner);
    assert!(!pool.initial_claimed, EAlreadyClaimed);
    assert!(balance::value(&pool.total_raised) >= pool.min_raise, EMinRaiseNotMet);
    
    pool.initial_claimed = true;
    pool.is_open = false;
    
    let total = balance::value(&pool.total_raised);
    let release_amount = (total * INITIAL_RELEASE_PERCENT) / 10000;
    pool.total_released = release_amount;
    
    emit(FundingCompleted {
        pool_id: uid_to_inner(&pool.id),
        startup_id: pool.startup_id,
        total_raised: total,
        revenue_token_supply: pool.total_tokens,
    });
    
    emit(PoolClosed {
        pool_id: uid_to_inner(&pool.id),
        startup_id: pool.startup_id,
        reason: 0, // completed
    });
    
    let balance = balance::split(&mut pool.total_raised, release_amount);
    coin::from_balance(balance, ctx)
}

/// Set governance contract to control future releases
public fun set_governance(
    pool: &mut FundingPool,
    governance_id: ID,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == pool.owner, ENotOwner);
    assert!(pool.initial_claimed, EMinRaiseNotMet);
    assert!(option::is_none(&pool.governance_id), EGovernanceAlreadySet);
    
    pool.governance_id = option::some(governance_id);
    
    emit(GovernanceSet {
        pool_id: uid_to_inner(&pool.id),
        startup_id: pool.startup_id,
        governance_id,
    });
}

/// Release funds (called by governance after approval)
public fun release_funds(
    pool: &mut FundingPool,
    governance_id: ID,
    recipient: address,
    amount: u64,
    _ctx: &mut TxContext,
): Coin<SUI> {
    let authorized = if (option::is_some(&pool.governance_id)) {
        *option::borrow(&pool.governance_id) == governance_id
    } else {
        false
    };
    assert!(authorized, EReleaseNotApproved);
    
    let available = balance::value(&pool.total_raised);
    assert!(available >= amount, ENoReleasableFunds);
    
    pool.total_released = pool.total_released + amount;
    
    emit(FundsReleased {
        pool_id: uid_to_inner(&pool.id),
        startup_id: pool.startup_id,
        governance_id,
        recipient,
        amount,
    });
    
    let balance = balance::split(&mut pool.total_raised, amount);
    coin::from_balance(balance, _ctx)
}

// ============ View Functions ============

/// Derive position key from startup and investor
/// Uses the investor address as the key (it's unique per startup)
fun derive_position_key(_startup_id: &ID, investor: &address): ID {
    id_from_address(*investor)
}

/// Get startup ID
public fun get_startup_id(pool: &FundingPool): ID {
    pool.startup_id
}

/// Get revenue token ID
public fun get_revenue_token_id(pool: &FundingPool): ID {
    pool.revenue_token_id
}

/// Get total raised
public fun get_total_raised(pool: &FundingPool): u64 {
    balance::value(&pool.total_raised)
}

/// Get total tokens
public fun get_total_tokens(pool: &FundingPool): u64 {
    pool.total_tokens
}

/// Get total released
public fun get_total_released(pool: &FundingPool): u64 {
    pool.total_released
}

/// Get remaining balance
public fun get_remaining(pool: &FundingPool): u64 {
    balance::value(&pool.total_raised)
}

/// Get investor position
public fun get_position(pool: &FundingPool, investor: &address): Option<InvestorPosition> {
    let key = derive_position_key(&pool.startup_id, investor);
    if (df::exists(&pool.id, key)) {
        let pos: &InvestorPosition = df::borrow(&pool.id, key);
        option::some(*pos)
    } else {
        option::none()
    }
}

/// Get investor's token balance
public fun get_token_balance(pool: &FundingPool, investor: &address): u64 {
    let key = derive_position_key(&pool.startup_id, investor);
    if (df::exists(&pool.id, key)) {
        let pos: &InvestorPosition = df::borrow(&pool.id, key);
        pos.tokens_owned
    } else {
        0
    }
}

/// Check if funding successful
public fun is_funding_successful(pool: &FundingPool): bool {
    balance::value(&pool.total_raised) >= pool.min_raise
}

/// Get governance ID
public fun get_governance_id(pool: &FundingPool): Option<ID> {
    pool.governance_id
}

/// Get pool stats
public fun get_pool_stats(pool: &FundingPool): (u64, u64, u64, u64, bool, bool) {
    (
        balance::value(&pool.total_raised),
        pool.total_tokens,
        pool.total_released,
        balance::value(&pool.total_raised),
        pool.is_open,
        pool.initial_claimed
    )
}
