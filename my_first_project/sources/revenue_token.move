/// Module: revenue_token
/// Revenue-share tokens for startups. Each startup has one token type
/// that represents ownership/share in the startup. Token holders have
/// voting rights in governance and receive proportional revenue shares.
module startup_fund::revenue_token;

use std::string::String;
use std::option;
use sui::coin::{Self, TreasuryCap, Coin};
use sui::object::ID;
use sui::tx_context::TxContext;
use sui::event::emit;
use sui::transfer;
use sui::coin_registry as cr;

// ============ Events ============

/// Emitted when a new revenue token is created for a startup
public struct RevenueTokenCreated has copy, drop {
    startup_id: ID,
    token_name: String,
    treasury_cap_id: ID,
}

/// Emitted when revenue is distributed to token holders
public struct RevenueDistributed has copy, drop {
    startup_id: ID,
    total_amount: u64,
    holder_count: u64,
}

/// Emitted when tokens are transferred
public struct TokensTransferred has copy, drop {
    startup_id: ID,
    from: address,
    to: address,
    amount: u64,
}

// ============ Structs ============

/// One-Time Witness for revenue token
public struct REVENUE_TOKEN has drop {}

// ============ Entry Functions ============

/// Create a new revenue token for a startup
/// Returns the TreasuryCap which the startup controls
public fun create_revenue_token(
    _witness: REVENUE_TOKEN,
    startup_id: ID,
    token_name: String,
    max_supply: u64,
    ctx: &mut TxContext,
): TreasuryCap<REVENUE_TOKEN> {
    let symbol = std::string::utf8(b"REV");
    let name = token_name;
    let description = std::string::utf8(b"Revenue share token");
    let icon_url = std::string::utf8(b"");
    
    let (initializer, treasury_cap) = cr::new_currency_with_otw(
        _witness,
        0u8,
        symbol,
        name,
        description,
        icon_url,
        ctx,
    );
    
    emit(RevenueTokenCreated {
        startup_id,
        token_name,
        treasury_cap_id: sui::object::id(&treasury_cap),
    });
    
    // Finalize the currency registration
    cr::finalize_and_delete_metadata_cap(initializer, ctx);
    
    treasury_cap
}

/// Mint revenue tokens to a recipient
public fun mint(
    treasury_cap: &mut TreasuryCap<REVENUE_TOKEN>,
    startup_id: ID,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    let coin = coin::mint(treasury_cap, amount, ctx);
    transfer::public_transfer(coin, recipient);
    
    emit(TokensTransferred {
        startup_id,
        from: @0x0,
        to: recipient,
        amount,
    });
}

/// Burn revenue tokens
public fun burn(
    treasury_cap: &mut TreasuryCap<REVENUE_TOKEN>,
    coin: Coin<REVENUE_TOKEN>,
) {
    coin::burn(treasury_cap, coin);
}
