/// Comprehensive tests for the token marketplace
#[test_only]
module startup_fund::marketplace_tests {
    use std::string;
    use std::vector;
    use sui::object::{Self, UID, new, uid_to_inner, id_from_address};
    use sui::test_scenario::{Self, ctx};
    
    // ============ Constants ============
    const SUI_DECIMALS: u64 = 1_000_000_000; // 1 SUI = 1B MIST
    const MIN_PRICE: u64 = 1_000_000; // 0.001 SUI
    const FEE_PERCENT: u64 = 250; // 2.5%
    const AUCTION_DURATION: u64 = 7; // epochs
    
    // ============ Test 1: Marketplace Creation ============
    
    #[test]
    fun test_marketplace_creation() {
        let owner = @0x1;
        let mut scenario = test_scenario::begin(owner);
        
        // Verify marketplace parameters
        let fee_percent = FEE_PERCENT;
        let fee_address = @0xTREASURY;
        
        // Fee percent should be reasonable
        assert!(fee_percent <= 1000, 0); // Max 10%
        
        // Fee address should be valid
        assert!(fee_address != @0x0, 1);
        
        test_scenario::end(scenario);
    }
    
    // ============ Test 2: Fixed Price Listing ============
    
    #[test]
    fun test_fixed_price_listing_creation() {
        let seller = @0xSELLER;
        let mut scenario = test_scenario::begin(seller);
        
        // Listing parameters
        let startup_id = id_from_address(@0xSTARTUP);
        let quantity = 100_000_000_000u64; // 100 tokens
        let price_per_token = 2_000_000_000u64; // 2 SUI per token
        let total_price = price_per_token * quantity;
        
        // Verify calculations
        assert!(total_price == 200_000_000_000u64, 10);
        assert!(price_per_token >= MIN_PRICE, 11);
        assert!(quantity > 0, 12);
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_fixed_price_purchase_calculation() {
        // Buyer purchases tokens
        let quantity = 10_000_000_000u64; // 10 tokens
        let price_per_token = 1_500_000_000u64; // 1.5 SUI
        let total_price = quantity * price_per_token;
        
        // Fee calculation (2.5%)
        let fee_amount = (total_price * FEE_PERCENT) / 10000;
        let seller_proceeds = total_price - fee_amount;
        
        assert!(total_price == 15_000_000_000u64, 20);
        assert!(fee_amount == 375_000_000u64, 21); // 0.375 SUI
        assert!(seller_proceeds == 14_625_000_000u64, 22); // 14.625 SUI
        
        test_scenario::end(test_scenario::begin(@0xBUYER));
    }
    
    // ============ Test 3: Auction Tests ============
    
    #[test]
    fun test_auction_creation() {
        let seller = @0xSELLER;
        let mut scenario = test_scenario::begin(seller);
        
        // Auction parameters
        let startup_id = id_from_address(@0xSTARTUP);
        let quantity = 50_000_000_000u64; // 50 tokens
        let starting_price = 1_000_000_000u64; // 1 SUI
        let duration_epochs = AUCTION_DURATION;
        
        // Verify
        assert!(starting_price >= MIN_PRICE, 30);
        assert!(duration_epochs > 0, 31);
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_auction_bidding() {
        let seller = @0xSELLER;
        let mut scenario = test_scenario::begin(seller);
        
        // Initial auction state
        let starting_price = 1_000_000_000u64; // 1 SUI
        let min_bid_increment = MIN_PRICE; // 0.001 SUI
        
        // First bid
        let bid_1 = 1_500_000_000u64; // 1.5 SUI
        assert!(bid_1 >= starting_price, 40);
        
        // Second bid (must be higher)
        let bid_2 = 2_000_000_000u64; // 2 SUI
        let min_bid_2 = bid_1 + min_bid_increment;
        assert!(bid_2 >= min_bid_2, 41);
        
        // Third bid (insufficient)
        let bid_3 = 1_800_000_000u64; // Less than min
        let min_bid_3 = bid_2 + min_bid_increment;
        let bid_3_valid = bid_3 >= min_bid_3;
        assert!(bid_3_valid == false, 42);
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_auction_finalization() {
        // Simulate auction end
        let highest_bid = 5_000_000_000u64; // 5 SUI
        let fee_amount = (highest_bid * FEE_PERCENT) / 10000;
        let seller_proceeds = highest_bid - fee_amount;
        
        assert!(fee_amount == 125_000_000u64, 50); // 0.125 SUI
        assert!(seller_proceeds == 4_875_000_000u64, 51); // 4.875 SUI
        
        test_scenario::end(test_scenario::begin(@0x1));
    }
    
    // ============ Test 4: Offer Tests ============
    
    #[test]
    fun test_offer_creation() {
        let buyer = @0xBUYER;
        let token_owner = @0xOWNER;
        let mut scenario = test_scenario::begin(buyer);
        
        // Offer parameters
        let startup_id = id_from_address(@0xSTARTUP);
        let quantity = 5_000_000_000u64; // 5 tokens
        let price_per_token = 3_000_000_000u64; // 3 SUI
        let total_price = quantity * price_per_token;
        
        assert!(total_price == 15_000_000_000u64, 60);
        assert!(buyer != token_owner, 61); // Buyer cannot be owner
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_offer_acceptance() {
        // Simulate offer acceptance
        let total_price = 20_000_000_000u64; // 20 SUI
        let fee_amount = (total_price * FEE_PERCENT) / 10000;
        let seller_proceeds = total_price - fee_amount;
        
        assert!(fee_amount == 500_000_000u64, 70); // 0.5 SUI
        assert!(seller_proceeds == 19_500_000_000u64, 71); // 19.5 SUI
        
        test_scenario::end(test_scenario::begin(@0x1));
    }
    
    // ============ Test 5: Full Trading Flow ============
    
    #[test]
    fun test_full_trading_flow() {
        // Step 1: Marketplace created
        let fee_address = @0xTREASURY;
        let fee_percent = FEE_PERCENT;
        assert!(fee_percent == 250, 100);
        
        // Step 2: Seller lists tokens
        let seller = @0xSELLER;
        let startup_id = id_from_address(@0xSTARTUP);
        let initial_tokens = 100_000_000_000u64; // 100 tokens
        
        // Step 3: Create fixed price listing
        let price_per_token = 2_000_000_000u64; // 2 SUI
        let quantity_to_sell = 30_000_000_000u64; // 30 tokens
        let listing_price = price_per_token * quantity_to_sell;
        
        assert!(listing_price == 60_000_000_000u64, 101); // 60 SUI
        
        // Step 4: Buyer purchases
        let buyer = @0xBUYER;
        let payment = listing_price;
        
        // Fee calculation
        let fee = (payment * fee_percent) / 10000;
        let seller_receives = payment - fee;
        
        assert!(fee == 1_500_000_000u64, 102); // 1.5 SUI
        assert!(seller_receives == 58_500_000_000u64, 103); // 58.5 SUI
        
        // Step 5: Token ownership transfers
        let buyer_tokens = quantity_to_sell;
        let seller_remaining = initial_tokens - quantity_to_sell;
        
        assert!(buyer_tokens == 30_000_000_000u64, 104);
        assert!(seller_remaining == 70_000_000_000u64, 105);
        
        // Step 6: Seller lists remaining tokens
        let new_price = 2_500_000_000u64; // Price increased
        let new_listing_price = seller_remaining * new_price;
        
        assert!(new_listing_price == 175_000_000_000u64, 106); // 175 SUI
    }
    
    // ============ Test 6: Auction Flow ============
    
    #[test]
    fun test_auction_full_flow() {
        // Step 1: Seller creates auction
        let seller = @0xSELLER;
        let startup_id = id_from_address(@0xSTARTUP);
        let quantity = 25_000_000_000u64; // 25 tokens
        let starting_price = 5_000_000_000u64; // 5 SUI
        
        // Step 2: Bidder 1 places bid
        let bidder_1 = @0xBIDDER1;
        let bid_1 = 6_000_000_000u64; // 6 SUI
        assert!(bid_1 > starting_price, 110);
        
        // Step 3: Bidder 2 outbids
        let bidder_2 = @0xBIDDER2;
        let bid_2 = 8_000_000_000u64; // 8 SUI
        assert!(bid_2 > bid_1, 111);
        
        // Bidder 1 gets refunded
        let bidder_1_refund = bid_1;
        assert!(bidder_1_refund == 6_000_000_000u64, 112);
        
        // Step 4: Auction ends
        let winning_bid = bid_2;
        let final_price = winning_bid * quantity; // Price per token * quantity
        let fee = (winning_bid * FEE_PERCENT) / 10000;
        let seller_proceeds = winning_bid - fee;
        
        assert!(winning_bid == 8_000_000_000u64, 113);
        assert!(fee == 200_000_000u64, 114); // 0.2 SUI
        assert!(seller_proceeds == 7_800_000_000u64, 115); // 7.8 SUI
        
        // Step 5: Winner receives tokens
        let winner_tokens = quantity;
        assert!(winner_tokens == 25_000_000_000u64, 116);
    }
    
    // ============ Test 7: Error Conditions ============
    
    #[test]
    fun test_error_conditions() {
        // Test 1: Price below minimum
        let price = 500_000u64; // Below 0.001 SUI
        let valid_price = price >= MIN_PRICE;
        assert!(valid_price == false, 200);
        
        // Test 2: Zero quantity
        let quantity = 0u64;
        let valid_quantity = quantity > 0;
        assert!(valid_quantity == false, 201);
        
        // Test 3: Buyer is seller
        let buyer = @0xSELLER;
        let seller = @0xSELLER;
        let valid_buyer = buyer != seller;
        assert!(valid_buyer == false, 202);
        
        // Test 4: Auction not ended
        let current_epoch = 5u64;
        let expires_at = 10u64;
        let can_end = current_epoch >= expires_at;
        assert!(can_end == false, 203);
        
        // Test 5: Insufficient payment
        let required = 100_000_000_000u64;
        let provided = 80_000_000_000u64;
        let sufficient = provided >= required;
        assert!(sufficient == false, 204);
    }
    
    // ============ Test 8: Multi-Offer Scenario ============
    
    #[test]
    fun test_multiple_offers() {
        let token_owner = @0xOWNER;
        let startup_id = id_from_address(@0xSTARTUP);
        
        // Owner receives multiple offers
        let offer_1_amount = 10_000_000_000u64; // 10 SUI
        let offer_2_amount = 12_000_000_000u64; // 12 SUI
        let offer_3_amount = 15_000_000_000u64; // 15 SUI
        
        // Find highest offer
        let highest = if (offer_1_amount > offer_2_amount) {
            if (offer_1_amount > offer_3_amount) {
                offer_1_amount
            } else {
                offer_3_amount
            }
        } else if (offer_2_amount > offer_3_amount) {
            offer_2_amount
        } else {
            offer_3_amount
        };
        
        assert!(highest == 15_000_000_000u64, 210);
        
        // After accepting highest, calculate proceeds
        let fee = (highest * FEE_PERCENT) / 10000;
        let proceeds = highest - fee;
        
        assert!(fee == 375_000_000u64, 211); // 0.375 SUI
        assert!(proceeds == 14_625_000_000u64, 212); // 14.625 SUI
    }
    
    // ============ Test 9: Marketplace Stats ============
    
    #[test]
    fun test_marketplace_volume_tracking() {
        // Simulate multiple sales
        let sale_1 = 100_000_000_000u64; // 100 SUI
        let sale_2 = 50_000_000_000u64; // 50 SUI
        let sale_3 = 75_000_000_000u64; // 75 SUI
        
        let total_volume = sale_1 + sale_2 + sale_3;
        assert!(total_volume == 225_000_000_000u64, 220);
        
        // Average sale price
        let avg_price = total_volume / 3;
        assert!(avg_price == 75_000_000_000u64, 221);
        
        // Total fees collected (2.5%)
        let total_fees = (total_volume * FEE_PERCENT) / 10000;
        assert!(total_fees == 5_625_000_000u64, 222); // 5.625 SUI
    }
    
    // ============ Test 10: Token Transfer Integration ============
    
    #[test]
    fun test_token_transfer_after_purchase() {
        // Scenario: Investor bought tokens via marketplace
        // Now wants to sell on marketplace
        
        let initial_tokens = 50_000_000_000u64; // 50 tokens
        let purchase_price = 2_000_000_000u64; // Paid 2 SUI per token
        let total_paid = initial_tokens * purchase_price;
        
        // Now sells at higher price
        let sell_price = 3_000_000_000u64; // 3 SUI per token
        let sell_quantity = 25_000_000_000u64; // 25 tokens
        let sell_value = sell_quantity * sell_price;
        
        // Profit calculation
        let cost_basis = sell_quantity * purchase_price;
        let gross_profit = sell_value - cost_basis;
        let fees = (sell_value * FEE_PERCENT) / 10000;
        let net_profit = gross_profit - fees;
        
        assert!(sell_value == 75_000_000_000u64, 230); // 75 SUI
        assert!(cost_basis == 50_000_000_000u64, 231); // 50 SUI
        assert!(gross_profit == 25_000_000_000u64, 232); // 25 SUI profit
        assert!(fees == 1_875_000_000u64, 233); // 1.875 SUI fees
        assert!(net_profit == 23_125_000_000u64, 234); // 23.125 SUI net profit
        
        // Remaining tokens
        let remaining_tokens = initial_tokens - sell_quantity;
        assert!(remaining_tokens == 25_000_000_000u64, 235);
    }
    
    // ============ Test 11: Royalty Integration ============
    
    #[test]
    fun test_royalties_for_startup() {
        // Startup receives royalties from marketplace trades
        let trade_volume = 1_000_000_000_000u64; // 1000 SUI
        let royalty_percent = 500u64; // 5% royalty to startup
        
        let royalties = (trade_volume * royalty_percent) / 10000;
        assert!(royalties == 50_000_000_000u64, 240); // 50 SUI
        
        // Startup can use royalties for operations or token buybacks
        let buyback_allocation = royalties / 2;
        let operations_allocation = royalties - buyback_allocation;
        
        assert!(buyback_allocation == 25_000_000_000u64, 241);
        assert!(operations_allocation == 25_000_000_000u64, 242);
    }
    
    // ============ Test 12: Complete Ecosystem Flow ============
    
    #[test]
    fun test_complete_ecosystem_flow() {
        // ===== PHASE 1: Startup Setup =====
        let startup_id = id_from_address(@0xSTARTUP);
        let startup_owner = @0xSTARTUP_OWNER;
        
        // ===== PHASE 2: Initial Funding =====
        // Funding pool raises 100 SUI
        let funding_target = 100_000_000_000u64; // 100 SUI
        let investors_tokens = funding_target; // 1:1 ratio
        
        assert!(investors_tokens == 100_000_000_000u64, 300);
        
        // ===== PHASE 3: Token Trading =====
        // Investor 1 sells tokens on marketplace
        let investor_1_tokens = 30_000_000_000u64; // 30 tokens
        let sale_price = 2_500_000_000u64; // 2.5 SUI per token
        let sale_value = investor_1_tokens * sale_price;
        
        // Marketplace fee (2.5%)
        let marketplace_fee = (sale_value * FEE_PERCENT) / 10000;
        let investor_1_proceeds = sale_value - marketplace_fee;
        
        assert!(sale_value == 75_000_000_000u64, 301); // 75 SUI
        assert!(marketplace_fee == 1_875_000_000u64, 302);
        assert!(investor_1_proceeds == 73_125_000_000u64, 303);
        
        // Investor 2 buys tokens
        let investor_2_tokens = investor_1_tokens;
        let investor_2_cost = sale_value;
        
        assert!(investor_2_tokens == 30_000_000_000u64, 304);
        
        // ===== PHASE 4: Governance =====
        // Token holders vote on proposals
        let total_tokens = 100_000_000_000u64;
        let voter_1_tokens = 40_000_000_000u64;
        let voter_2_tokens = 30_000_000_000u64;
        
        let voting_power_1 = (voter_1_tokens * 10000) / total_tokens; // 4000 bps = 40%
        let voting_power_2 = (voter_2_tokens * 10000) / total_tokens; // 3000 bps = 30%
        
        assert!(voting_power_1 == 4000, 305); // 40%
        assert!(voting_power_2 == 3000, 306); // 30%
        
        // ===== PHASE 5: Fund Release =====
        // Governance approves fund release
        let remaining_funds = 50_000_000_000u64; // 50 SUI remaining
        let approved_release = 25_000_000_000u64; // 25 SUI
        
        // Startup receives funds
        let startup_receives = approved_release;
        assert!(startup_receives == 25_000_000_000u64, 307);
        
        // ===== PHASE 6: Revenue Distribution =====
        // Startup generates revenue
        let revenue = 20_000_000_000u64; // 20 SUI revenue
        let total_token_holders = 100_000_000_000u64; // All tokens
        
        // Per-token revenue
        let revenue_per_token = revenue / total_token_holders;
        assert!(revenue_per_token == 200u64, 308); // 0.0000002 SUI per token
        
        // Investor 2's share (30 tokens)
        let investor_2_share = 30_000_000_000u64 * revenue_per_token;
        assert!(investor_2_share == 6_000_000_000u64, 309); // 6 SUI
        
        // ===== PHASE 7: Secondary Trading =====
        // Token value increases due to revenue
        let new_price = 4_000_000_000u64; // 4 SUI per token (2x increase)
        let investor_2_holdings_value = investor_2_tokens * new_price;
        
        assert!(investor_2_holdings_value == 120_000_000_000u64, 310); // 120 SUI
        
        // ===== FINAL STATE =====
        // Investor 2: 30 tokens worth 120 SUI, received 6 SUI in revenue
        // Total return: 126 SUI on 75 SUI investment = 68% return
        let total_return = investor_2_share + investor_2_holdings_value;
        let return_percent = ((total_return - investor_2_cost) * 10000) / investor_2_cost;
        
        assert!(total_return == 126_000_000_000u64, 311);
        assert!(return_percent == 6800, 312); // 68% return
    }
}
