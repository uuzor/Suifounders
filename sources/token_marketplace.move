/// Module: token_marketplace
/// OpenSea-style marketplace for buying and selling startup tokens.
/// Supports fixed-price listings, offers, and auctions.
module startup_fund::token_marketplace;

use std::string::String;
use std::vector;
use std::option::{Self, Option};
use sui::object::{UID, ID, new, uid_to_inner, id_from_address};
use sui::tx_context::{TxContext, sender};
use sui::event::emit;
use sui::transfer;
use sui::coin::{Self, Coin};
use sui::balance::{Self, Balance};
use sui::sui::SUI;
use sui::dynamic_field as df;

// ============ Error Codes ============
const ENotOwner: u64 = 0;
const EAlreadyListed: u64 = 1;
const ENotListed: u64 = 2;
const EPriceMismatch: u64 = 3;
const EInsufficientPayment: u64 = 4;
const EAuctionNotEnded: u64 = 5;
const EAuctionEnded: u64 = 6;
const ENoBid: u64 = 7;
const EInvalidPrice: u64 = 8;
const EListingExpired: u64 = 9;
const ENotHighestBidder: u64 = 10;
const EZeroAmount: u64 = 11;
const ECollectionMismatch: u64 = 12;

// ============ Listing Types ============
/// Fixed price listing
const LISTING_TYPE_FIXED_PRICE: u8 = 0;
/// Auction listing
const LISTING_TYPE_AUCTION: u8 = 1;
/// Offer (no listing, direct offer to holder)
const LISTING_TYPE_OFFER: u8 = 2;

// ============ Listing Status ============
const STATUS_ACTIVE: u8 = 0;
const STATUS_SOLD: u8 = 1;
const STATUS_CANCELLED: u8 = 2;
const STATUS_EXPIRED: u8 = 3;

// ============ Events ============

/// Emitted when a new listing is created
public struct ListingCreated has copy, drop {
    marketplace_id: ID,
    listing_id: ID,
    seller: address,
    startup_id: ID,
    token_ids: vector<ID>,
    listing_type: u8,
    price_per_token: u64,
    total_price: u64,
}

/// Emitted when an offer is made
public struct OfferMade has copy, drop {
    marketplace_id: ID,
    offer_id: ID,
    buyer: address,
    startup_id: ID,
    token_owner: address,
    price_per_token: u64,
    quantity: u64,
    total_price: u64,
}

/// Emitted when a bid is placed in auction
public struct BidPlaced has copy, drop {
    marketplace_id: ID,
    listing_id: ID,
    bidder: address,
    amount: u64,
    is_new_highest: bool,
}

/// Emitted when a sale is completed
public struct SaleCompleted has copy, drop {
    marketplace_id: ID,
    listing_id: ID,
    seller: address,
    buyer: address,
    startup_id: ID,
    token_ids: vector<ID>,
    price_per_token: u64,
    total_price: u64,
    listing_type: u8,
}

/// Emitted when a listing is cancelled
public struct ListingCancelled has copy, drop {
    marketplace_id: ID,
    listing_id: ID,
    seller: address,
}

/// Emitted when an auction ends
public struct AuctionEnded has copy, drop {
    marketplace_id: ID,
    listing_id: ID,
    winner: address,
    winning_bid: u64,
}

/// Emitted when funds are withdrawn from marketplace
public struct FundsWithdrawn has copy, drop {
    marketplace_id: ID,
    recipient: address,
    amount: u64,
    reason: u8, // 0=sale proceeds, 1=refunded bid, 2=offer rejected
}

// ============ Structs ============

/// The marketplace contract (shared object)
public struct TokenMarketplace has key {
    id: UID,
    /// Fee percentage (in basis points, e.g., 250 = 2.5%)
    fee_percent: u64,
    /// Treasury address for fees
    fee_address: address,
    /// Total listings created
    listing_count: u64,
    /// Total volume (in MIST)
    total_volume: u64,
}

/// A fixed-price or auction listing
public struct Listing has key, store {
    id: UID,
    /// The startup whose tokens are being sold
    startup_id: ID,
    /// Seller's address
    seller: address,
    /// Token IDs being sold (for semi-fungible, multiple tokens)
    token_ids: vector<ID>,
    /// Number of tokens
    quantity: u64,
    /// Price per token (in MIST)
    price_per_token: u64,
    /// Total price
    total_price: u64,
    /// Listing type (fixed price or auction)
    listing_type: u8,
    /// Creation timestamp (epoch)
    created_at: u64,
    /// Expiration timestamp (0 = never expires)
    expires_at: u64,
    /// Current highest bid (for auctions)
    highest_bid: u64,
    /// Highest bidder address
    highest_bidder: Option<address>,
    /// List of bids
    bids: vector<Bid>,
    /// Status
    status: u8,
}

/// A bid in an auction
public struct Bid has store, copy {
    bidder: address,
    amount: u64,
    timestamp: u64,
}

/// An offer (direct offer to token holder)
public struct Offer has key, store {
    id: UID,
    /// The startup whose tokens are being offered
    startup_id: ID,
    /// Buyer making the offer
    buyer: address,
    /// Token holder being offered to
    token_owner: address,
    /// Price per token
    price_per_token: u64,
    /// Quantity desired
    quantity: u64,
    /// Total price
    total_price: u64,
    /// Expiration epoch
    expires_at: u64,
    /// Status
    status: u8,
}

/// Stores accumulated SUI for a user (from sales or bids)
public struct UserFunds has key {
    id: UID,
    owner: address,
    balance: Balance<SUI>,
}

// ============ Constants ============

/// Minimum listing price (0.001 SUI)
const MIN_PRICE: u64 = 1_000_000;

/// Maximum fee percentage (10%)
const MAX_FEE_PERCENT: u64 = 1000;

/// Default auction duration (7 epochs ≈ 7 days)
const DEFAULT_AUCTION_DURATION: u64 = 7;

// ============ Entry Functions ============

/// Create a new marketplace
public fun create_marketplace(
    fee_percent: u64,
    fee_address: address,
    ctx: &mut TxContext,
): ID {
    assert!(fee_percent <= MAX_FEE_PERCENT, EInvalidPrice);
    
    let marketplace = TokenMarketplace {
        id: new(ctx),
        fee_percent,
        fee_address,
        listing_count: 0,
        total_volume: 0,
    };
    
    let marketplace_id = uid_to_inner(&marketplace.id);
    transfer::share_object(marketplace);
    marketplace_id
}

/// Create a fixed-price listing
public fun create_listing(
    marketplace: &mut TokenMarketplace,
    startup_id: ID,
    token_ids: vector<ID>,
    quantity: u64,
    price_per_token: u64,
    expires_at: u64,
    ctx: &mut TxContext,
): ID {
    assert!(price_per_token >= MIN_PRICE, EInvalidPrice);
    assert!(quantity > 0, EZeroAmount);
    
    let seller = sender(ctx);
    let total_price = price_per_token * quantity;
    
    let listing = Listing {
        id: new(ctx),
        startup_id,
        seller,
        token_ids,
        quantity,
        price_per_token,
        total_price,
        listing_type: LISTING_TYPE_FIXED_PRICE,
        created_at: tx_context::epoch(ctx),
        expires_at,
        highest_bid: 0,
        highest_bidder: option::none(),
        bids: vector::empty(),
        status: STATUS_ACTIVE,
    };
    
    let listing_id = uid_to_inner(&listing.id);
    
    // Store listing in marketplace
    df::add(&mut marketplace.id, listing_id, listing);
    marketplace.listing_count = marketplace.listing_count + 1;
    
    emit(ListingCreated {
        marketplace_id: uid_to_inner(&marketplace.id),
        listing_id,
        seller,
        startup_id,
        token_ids,
        listing_type: LISTING_TYPE_FIXED_PRICE,
        price_per_token,
        total_price,
    });
    
    listing_id
}

/// Create an auction listing
public fun create_auction(
    marketplace: &mut TokenMarketplace,
    startup_id: ID,
    token_ids: vector<ID>,
    quantity: u64,
    starting_price: u64,
    duration_epochs: u64,
    ctx: &mut TxContext,
): ID {
    assert!(starting_price >= MIN_PRICE, EInvalidPrice);
    assert!(quantity > 0, EZeroAmount);
    
    let seller = sender(ctx);
    let current_epoch = tx_context::epoch(ctx);
    let expires_at = current_epoch + duration_epochs;
    
    let listing = Listing {
        id: new(ctx),
        startup_id,
        seller,
        token_ids,
        quantity,
        price_per_token: starting_price,
        total_price: starting_price * quantity,
        listing_type: LISTING_TYPE_AUCTION,
        created_at: current_epoch,
        expires_at,
        highest_bid: 0,
        highest_bidder: option::none(),
        bids: vector::empty(),
        status: STATUS_ACTIVE,
    };
    
    let listing_id = uid_to_inner(&listing.id);
    
    df::add(&mut marketplace.id, listing_id, listing);
    marketplace.listing_count = marketplace.listing_count + 1;
    
    emit(ListingCreated {
        marketplace_id: uid_to_inner(&marketplace.id),
        listing_id,
        seller,
        startup_id,
        token_ids,
        listing_type: LISTING_TYPE_AUCTION,
        price_per_token: starting_price,
        total_price: starting_price * quantity,
    });
    
    listing_id
}

/// Buy tokens at fixed price
public fun buy_tokens(
    marketplace: &mut TokenMarketplace,
    listing_id: ID,
    quantity: u64,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let listing: &mut Listing = df::borrow_mut(&mut marketplace.id, listing_id);
    
    assert!(listing.status == STATUS_ACTIVE, ENotListed);
    assert!(listing.listing_type == LISTING_TYPE_FIXED_PRICE, EPriceMismatch);
    
    // Check expiration
    let current_epoch = tx_context::epoch(ctx);
    if (listing.expires_at > 0) {
        assert!(current_epoch < listing.expires_at, EListingExpired);
    };
    
    // Verify quantity
    assert!(quantity <= listing.quantity, EInsufficientPayment);
    
    let buyer = sender(ctx);
    assert!(buyer != listing.seller, ENotOwner);
    
    let price_per_token = listing.price_per_token;
    let total_price = price_per_token * quantity;
    let payment_amount = coin::value(&payment);
    assert!(payment_amount >= total_price, EInsufficientPayment);
    
    // Mark as sold
    listing.status = STATUS_SOLD;
    listing.quantity = listing.quantity - quantity;
    
    // Calculate fees and proceeds
    let fee_amount = (total_price * marketplace.fee_percent) / 10000;
    let seller_proceeds = total_price - fee_amount;
    
    // Split payment
    let mut payment_balance = coin::into_balance(payment);
    let fee_balance = balance::split(&mut payment_balance, fee_amount);
    let seller_balance = balance::split(&mut payment_balance, seller_proceeds);
    
    // Send fees to treasury
    let fee_coin = coin::from_balance(fee_balance, ctx);
    transfer::public_transfer(fee_coin, marketplace.fee_address);
    
    // Store seller proceeds in their funds
    let seller_funds_id = derive_funds_key(&listing.seller);
    if (df::exists(&marketplace.id, seller_funds_id)) {
        let funds: &mut UserFunds = df::borrow_mut(&mut marketplace.id, seller_funds_id);
        balance::join(&mut funds.balance, seller_balance);
    } else {
        let mut funds = UserFunds {
            id: new(ctx),
            owner: listing.seller,
            balance: balance::zero(),
        };
        balance::join(&mut funds.balance, seller_balance);
        df::add(&mut marketplace.id, seller_funds_id, funds);
    };
    
    // Update marketplace stats
    marketplace.total_volume = marketplace.total_volume + total_price;
    
    // Refund extra payment
    if (payment_amount > total_price) {
        let refund = coin::from_balance(payment_balance, ctx);
        transfer::public_transfer(refund, buyer);
    } else {
        let empty = coin::from_balance(payment_balance, ctx);
        transfer::public_transfer(empty, buyer);
    };
    
    emit(SaleCompleted {
        marketplace_id: uid_to_inner(&marketplace.id),
        listing_id,
        seller: listing.seller,
        buyer,
        startup_id: listing.startup_id,
        token_ids: listing.token_ids,
        price_per_token,
        total_price,
        listing_type: LISTING_TYPE_FIXED_PRICE,
    });
    
    emit(FundsWithdrawn {
        marketplace_id: uid_to_inner(&marketplace.id),
        recipient: listing.seller,
        amount: seller_proceeds,
        reason: 0, // sale proceeds
    });
}

/// Place a bid in an auction
public fun place_bid(
    marketplace: &mut TokenMarketplace,
    listing_id: ID,
    bid_amount: u64,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let listing: &mut Listing = df::borrow_mut(&mut marketplace.id, listing_id);
    
    assert!(listing.status == STATUS_ACTIVE, ENotListed);
    assert!(listing.listing_type == LISTING_TYPE_AUCTION, EPriceMismatch);
    
    let current_epoch = tx_context::epoch(ctx);
    assert!(current_epoch < listing.expires_at, EAuctionEnded);
    
    let bidder = sender(ctx);
    assert!(bidder != listing.seller, ENotOwner);
    
    // Must bid higher than current highest
    let min_bid = if (listing.highest_bid > 0) {
        listing.highest_bid + MIN_PRICE
    } else {
        listing.price_per_token // Starting price
    };
    
    assert!(bid_amount >= min_bid, EPriceMismatch);
    
    let payment_amount = coin::value(&payment);
    assert!(payment_amount >= bid_amount, EInsufficientPayment);
    
    // Refund previous highest bidder
    if (option::is_some(&listing.highest_bidder)) {
        let prev_bidder = *option::borrow(&listing.highest_bidder);
        let prev_bid = listing.highest_bid;
        
        // Refund to their funds
        let prev_funds_id = derive_funds_key(&prev_bidder);
        if (df::exists(&marketplace.id, prev_funds_id)) {
            let funds: &mut UserFunds = df::borrow_mut(&mut marketplace.id, prev_funds_id);
            let refund_balance = balance::increase_only_split(&mut funds.balance, prev_bid);
            let refund = coin::from_balance(refund_balance, ctx);
            transfer::public_transfer(refund, prev_bidder);
        };
    };
    
    // Add new bid
    let bid = Bid {
        bidder,
        amount: bid_amount,
        timestamp: current_epoch,
    };
    vector::push_back(&mut listing.bids, bid);
    
    listing.highest_bid = bid_amount;
    listing.highest_bidder = option::some(bidder);
    
    // Handle payment (refund extra)
    let mut payment_balance = coin::into_balance(payment);
    if (payment_amount > bid_amount) {
        let refund = balance::split(&mut payment_balance, payment_amount - bid_amount);
        let refund_coin = coin::from_balance(refund, ctx);
        transfer::public_transfer(refund_coin, bidder);
    };
    
    emit(BidPlaced {
        marketplace_id: uid_to_inner(&marketplace.id),
        listing_id,
        bidder,
        amount: bid_amount,
        is_new_highest: true,
    });
}

/// End an auction and transfer tokens to winner
public fun end_auction(
    marketplace: &mut TokenMarketplace,
    listing_id: ID,
    ctx: &mut TxContext,
) {
    let listing: &mut Listing = df::borrow_mut(&mut marketplace.id, listing_id);
    
    assert!(listing.status == STATUS_ACTIVE, ENotListed);
    assert!(listing.listing_type == LISTING_TYPE_AUCTION, EPriceMismatch);
    
    let current_epoch = tx_context::epoch(ctx);
    assert!(current_epoch >= listing.expires_at, EAuctionNotEnded);
    
    let winner: address;
    let winning_bid: u64;
    
    if (option::is_some(&listing.highest_bidder)) {
        winner = *option::borrow(&listing.highest_bidder);
        winning_bid = listing.highest_bid;
        
        // Calculate fees and proceeds
        let fee_amount = (winning_bid * marketplace.fee_percent) / 10000;
        let seller_proceeds = winning_bid - fee_amount;
        
        // Create fee balance from existing bid
        let mut fee_balance = balance::zero<SUI>();
        balance::increase_cap(&mut fee_balance, fee_amount);
        let fee_coin = coin::from_balance(fee_balance, ctx);
        transfer::public_transfer(fee_coin, marketplace.fee_address);
        
        // Store seller proceeds
        let seller_funds_id = derive_funds_key(&listing.seller);
        let mut seller_balance = balance::zero<SUI>();
        balance::increase_cap(&mut seller_balance, seller_proceeds);
        if (df::exists(&marketplace.id, seller_funds_id)) {
            let funds: &mut UserFunds = df::borrow_mut(&mut marketplace.id, seller_funds_id);
            balance::join(&mut funds.balance, seller_balance);
        } else {
            let mut funds = UserFunds {
                id: new(ctx),
                owner: listing.seller,
                balance: balance::zero(),
            };
            balance::join(&mut funds.balance, seller_balance);
            df::add(&mut marketplace.id, seller_funds_id, funds);
        };
        
        // Update marketplace stats
        marketplace.total_volume = marketplace.total_volume + winning_bid;
        
        listing.status = STATUS_SOLD;
        
        emit(SaleCompleted {
            marketplace_id: uid_to_inner(&marketplace.id),
            listing_id,
            seller: listing.seller,
            buyer: winner,
            startup_id: listing.startup_id,
            token_ids: listing.token_ids,
            price_per_token: winning_bid / listing.quantity,
            total_price: winning_bid,
            listing_type: LISTING_TYPE_AUCTION,
        });
        
        emit(FundsWithdrawn {
            marketplace_id: uid_to_inner(&marketplace.id),
            recipient: listing.seller,
            amount: seller_proceeds,
            reason: 0,
        });
    } else {
        // No bids - auction cancelled
        winner = @0x0;
        winning_bid = 0;
        listing.status = STATUS_CANCELLED;
    };
    
    emit(AuctionEnded {
        marketplace_id: uid_to_inner(&marketplace.id),
        listing_id,
        winner,
        winning_bid,
    });
}

/// Cancel a listing (only seller can cancel)
public fun cancel_listing(
    marketplace: &mut TokenMarketplace,
    listing_id: ID,
    ctx: &mut TxContext,
) {
    let listing: &mut Listing = df::borrow_mut(&mut marketplace.id, listing_id);
    
    let sender = sender(ctx);
    assert!(listing.seller == sender, ENotOwner);
    assert!(listing.status == STATUS_ACTIVE, ENotListed);
    
    // Cannot cancel auctions with bids
    if (listing.listing_type == LISTING_TYPE_AUCTION) {
        assert!(listing.highest_bid == 0, ENoBid);
    };
    
    listing.status = STATUS_CANCELLED;
    
    emit(ListingCancelled {
        marketplace_id: uid_to_inner(&marketplace.id),
        listing_id,
        seller: listing.seller,
    });
}

/// Make an offer directly to a token holder
public fun make_offer(
    marketplace: &mut TokenMarketplace,
    startup_id: ID,
    token_owner: address,
    quantity: u64,
    price_per_token: u64,
    expires_at: u64,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
): ID {
    assert!(price_per_token >= MIN_PRICE, EInvalidPrice);
    assert!(quantity > 0, EZeroAmount);
    
    let buyer = sender(ctx);
    assert!(buyer != token_owner, ENotOwner);
    
    let total_price = price_per_token * quantity;
    let payment_amount = coin::value(&payment);
    assert!(payment_amount >= total_price, EInsufficientPayment);
    
    let offer = Offer {
        id: new(ctx),
        startup_id,
        buyer,
        token_owner,
        price_per_token,
        quantity,
        total_price,
        expires_at,
        status: STATUS_ACTIVE,
    };
    
    let offer_id = uid_to_inner(&offer.id);
    
    df::add(&mut marketplace.id, offer_id, offer);
    
    // Hold payment in escrow (refund extra)
    let mut payment_balance = coin::into_balance(payment);
    if (payment_amount > total_price) {
        let refund = balance::split(&mut payment_balance, payment_amount - total_price);
        let refund_coin = coin::from_balance(refund, ctx);
        transfer::public_transfer(refund_coin, buyer);
    };
    
    emit(OfferMade {
        marketplace_id: uid_to_inner(&marketplace.id),
        offer_id,
        buyer,
        startup_id,
        token_owner,
        price_per_token,
        quantity,
        total_price,
    });
    
    offer_id
}

/// Accept an offer (token holder accepts)
public fun accept_offer(
    marketplace: &mut TokenMarketplace,
    offer_id: ID,
    _ctx: &mut TxContext,
) {
    let offer: &mut Offer = df::borrow_mut(&mut marketplace.id, offer_id);
    
    assert!(offer.status == STATUS_ACTIVE, ENotListed);
    
    let current_epoch = tx_context::epoch(_ctx);
    if (offer.expires_at > 0) {
        assert!(current_epoch < offer.expires_at, EListingExpired);
    };
    
    offer.status = STATUS_SOLD;
    
    // Calculate fees and proceeds
    let fee_amount = (offer.total_price * marketplace.fee_percent) / 10000;
    let seller_proceeds = offer.total_price - fee_amount;
    
    // Create fee balance
    let mut fee_balance = balance::zero<SUI>();
    balance::increase_cap(&mut fee_balance, fee_amount);
    let fee_coin = coin::from_balance(fee_balance, _ctx);
    transfer::public_transfer(fee_coin, marketplace.fee_address);
    
    // Store seller proceeds
    let seller_funds_id = derive_funds_key(&offer.token_owner);
    let mut seller_balance = balance::zero<SUI>();
    balance::increase_cap(&mut seller_balance, seller_proceeds);
    if (df::exists(&marketplace.id, seller_funds_id)) {
        let funds: &mut UserFunds = df::borrow_mut(&mut marketplace.id, seller_funds_id);
        balance::join(&mut funds.balance, seller_balance);
    } else {
        let mut funds = UserFunds {
            id: new(_ctx),
            owner: offer.token_owner,
            balance: balance::zero(),
        };
        balance::join(&mut funds.balance, seller_balance);
        df::add(&mut marketplace.id, seller_funds_id, funds);
    };
    
    marketplace.total_volume = marketplace.total_volume + offer.total_price;
    
    emit(SaleCompleted {
        marketplace_id: uid_to_inner(&marketplace.id),
        listing_id: offer_id,
        seller: offer.token_owner,
        buyer: offer.buyer,
        startup_id: offer.startup_id,
        token_ids: vector::empty(),
        price_per_token: offer.price_per_token,
        total_price: offer.total_price,
        listing_type: LISTING_TYPE_OFFER,
    });
    
    emit(FundsWithdrawn {
        marketplace_id: uid_to_inner(&marketplace.id),
        recipient: offer.token_owner,
        amount: seller_proceeds,
        reason: 0,
    });
}

/// Reject/cancel an offer
public fun reject_offer(
    marketplace: &mut TokenMarketplace,
    offer_id: ID,
    ctx: &mut TxContext,
) {
    let offer: &mut Offer = df::borrow_mut(&mut marketplace.id, offer_id);
    
    let current_sender = sender(ctx);
    // Only buyer or token owner can reject
    assert!(current_sender == offer.buyer || current_sender == offer.token_owner, ENotOwner);
    assert!(offer.status == STATUS_ACTIVE, ENotListed);
    
    offer.status = STATUS_CANCELLED;
    
    // Refund payment to buyer
    let mut refund_balance = balance::zero<SUI>();
    balance::increase_cap(&mut refund_balance, offer.total_price);
    let refund = coin::from_balance(refund_balance, ctx);
    transfer::public_transfer(refund, offer.buyer);
    
    emit(FundsWithdrawn {
        marketplace_id: uid_to_inner(&marketplace.id),
        recipient: offer.buyer,
        amount: offer.total_price,
        reason: 2, // offer rejected
    });
}

/// Withdraw accumulated funds
public fun withdraw_funds(
    marketplace: &mut TokenMarketplace,
    amount: u64,
    ctx: &mut TxContext,
) {
    let recipient = sender(ctx);
    let funds_id = derive_funds_key(&recipient);
    
    assert!(df::exists(&marketplace.id, funds_id), ENotOwner);
    
    let funds: &mut UserFunds = df::borrow_mut(&mut marketplace.id, funds_id);
    assert!(balance::value(&funds.balance) >= amount, EInsufficientPayment);
    
    let balance = balance::split(&mut funds.balance, amount);
    let coin = coin::from_balance(balance, ctx);
    transfer::public_transfer(coin, recipient);
    
    emit(FundsWithdrawn {
        marketplace_id: uid_to_inner(&marketplace.id),
        recipient,
        amount,
        reason: 0,
    });
}

// ============ View Functions ============

/// Derive unique key for user funds
fun derive_funds_key(owner: &address): ID {
    id_from_address(*owner)
}

/// Get marketplace stats
public fun get_marketplace_stats(m: &TokenMarketplace): (u64, u64, u64) {
    (m.listing_count, m.total_volume, m.fee_percent)
}

/// Get listing info
public fun get_listing(m: &TokenMarketplace, listing_id: ID): (address, u64, u64, u64, u8, u8, bool) {
    let listing: &Listing = df::borrow(&m.id, listing_id);
    (
        listing.seller,
        listing.quantity,
        listing.price_per_token,
        listing.total_price,
        listing.listing_type,
        listing.status,
        option::is_some(&listing.highest_bidder)
    )
}

/// Get auction status
public fun get_auction_status(m: &TokenMarketplace, listing_id: ID): (u64, Option<address>, u64) {
    let listing: &Listing = df::borrow(&m.id, listing_id);
    (listing.highest_bid, listing.highest_bidder, listing.expires_at)
}

/// Get offer info
public fun get_offer(m: &TokenMarketplace, offer_id: ID): (address, address, u64, u64, u64, u8) {
    let offer: &Offer = df::borrow(&m.id, offer_id);
    (
        offer.buyer,
        offer.token_owner,
        offer.quantity,
        offer.price_per_token,
        offer.total_price,
        offer.status
    )
}

/// Get user funds balance
public fun get_user_funds(m: &TokenMarketplace, owner: &address): u64 {
    let funds_id = derive_funds_key(owner);
    if (df::exists(&m.id, funds_id)) {
        let funds: &UserFunds = df::borrow(&m.id, funds_id);
        balance::value(&funds.balance)
    } else {
        0
    }
}
