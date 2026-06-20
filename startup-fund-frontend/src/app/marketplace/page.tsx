'use client';

import { AppShell } from '@/components/AppShell';
import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react';
import { useState } from 'react';
import { 
  Layers, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Gavel,
  DollarSign,
  Filter,
  ChevronRight,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_IDS } from '@/lib/dapp-kit';

// Mock marketplace listings
const mockListings = [
  {
    id: '1',
    startupName: 'Nexus AI',
    symbol: 'NEXUS',
    seller: '0x1234...5678',
    price: 2.75,
    quantity: 1000,
    type: 'fixed',
    expiresAt: null,
    image: '🤖',
    change24h: 10.5,
  },
  {
    id: '2',
    startupName: 'GreenChain',
    symbol: 'GRCH',
    seller: '0xabcd...efgh',
    price: 1.90,
    quantity: 5000,
    type: 'auction',
    expiresAt: '2024-02-15',
    image: '🌱',
    currentBid: 1.85,
    change24h: 8.2,
  },
  {
    id: '3',
    startupName: 'MedVault',
    symbol: 'MVLT',
    seller: '0x9876...5432',
    price: 3.50,
    quantity: 2500,
    type: 'fixed',
    expiresAt: null,
    image: '🏥',
    change24h: -2.3,
  },
];

const mockOffers = [
  {
    id: '1',
    startupName: 'Nexus AI',
    symbol: 'NEXUS',
    buyer: '0xbuyer...addr',
    price: 2.60,
    quantity: 500,
    expiresAt: '2024-02-10',
    image: '🤖',
  },
];

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

function formatQuantity(qty: number): string {
  if (qty >= 1000000) return `${(qty / 1000000).toFixed(1)}M`;
  if (qty >= 1000) return `${(qty / 1000).toFixed(1)}K`;
  return qty.toString();
}

export default function MarketplacePage() {
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const [activeTab, setActiveTab] = useState<'listings' | 'offers' | 'history'>('listings');
  const [listingType, setListingType] = useState<'all' | 'fixed' | 'auction'>('all');

  const filteredListings = mockListings.filter((listing) => {
    if (listingType === 'all') return true;
    return listing.type === listingType;
  });

  const handleBuy = async (listingId: string, price: number, quantity: number) => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const tx = new Transaction();
      const packageId = PACKAGE_IDS['testnet'];

      const totalAmount = price * quantity * 1_000_000_000;

      tx.moveCall({
        target: `${packageId}::token_marketplace::buy_tokens`,
        arguments: [
          tx.object('0x0'), // marketplace
          tx.pure.id(listingId),
          tx.pure.u64(quantity),
          tx.splitCoins(tx.gas, [tx.pure.u64(totalAmount)]),
        ],
      });

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      
      if (result.$kind === 'FailedTransaction') {
        throw new Error(result.FailedTransaction.status.error?.message);
      }

      alert('Purchase successful!');
    } catch (error) {
      console.error('Purchase failed:', error);
      alert(`Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <AppShell>
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl lg:text-4xl font-outfit font-medium text-white mb-4">
            Token Marketplace
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Trade startup tokens with other investors. Buy, sell, or make offers on equity tokens.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface border border-white/10 p-4">
            <p className="text-sm text-gray-500 mb-1">24h Volume</p>
            <p className="text-xl font-mono font-semibold text-white">$1.2M</p>
          </div>
          <div className="bg-surface border border-white/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Active Listings</p>
            <p className="text-xl font-mono font-semibold text-white">156</p>
          </div>
          <div className="bg-surface border border-white/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Active Offers</p>
            <p className="text-xl font-mono font-semibold text-white">42</p>
          </div>
          <div className="bg-surface border border-white/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Avg. Price</p>
            <p className="text-xl font-mono font-semibold text-white">$2.45</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('listings')}
            className={`
              px-6 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'listings'
                ? 'border-accent-primary text-white'
                : 'border-transparent text-gray-400 hover:text-white'
              }
            `}
          >
            Listings ({filteredListings.length})
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`
              px-6 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'offers'
                ? 'border-accent-primary text-white'
                : 'border-transparent text-gray-400 hover:text-white'
              }
            `}
          >
            Offers ({mockOffers.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`
              px-6 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'history'
                ? 'border-accent-primary text-white'
                : 'border-transparent text-gray-400 hover:text-white'
              }
            `}
          >
            History
          </button>
        </div>

        {/* Filters */}
        {activeTab === 'listings' && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setListingType('all')}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${listingType === 'all'
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface border border-white/10 text-gray-400 hover:text-white'
                }
              `}
            >
              All
            </button>
            <button
              onClick={() => setListingType('fixed')}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2
                ${listingType === 'fixed'
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface border border-white/10 text-gray-400 hover:text-white'
                }
              `}
            >
              <DollarSign className="w-4 h-4" />
              Fixed Price
            </button>
            <button
              onClick={() => setListingType('auction')}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2
                ${listingType === 'auction'
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface border border-white/10 text-gray-400 hover:text-white'
                }
              `}
            >
              <Gavel className="w-4 h-4" />
              Auctions
            </button>
          </div>
        )}

        {/* Listings Grid */}
        {activeTab === 'listings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-surface border border-white/10 hover:border-white/20 transition-all duration-300"
                data-testid={`listing-card-${listing.id}`}
              >
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-surface-elevated rounded-lg flex items-center justify-center text-2xl">
                        {listing.image}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white font-outfit">
                          {listing.startupName}
                        </h3>
                        <p className="text-sm text-accent-primary font-mono">
                          ${listing.symbol}
                        </p>
                      </div>
                    </div>
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded flex items-center gap-1
                      ${listing.type === 'fixed'
                        ? 'bg-accent-primary/20 text-accent-primary'
                        : 'bg-purple-500/20 text-purple-400'
                      }
                    `}>
                      {listing.type === 'fixed' ? (
                        <DollarSign className="w-3 h-3" />
                      ) : (
                        <Gavel className="w-3 h-3" />
                      )}
                      {listing.type === 'fixed' ? 'Fixed' : 'Auction'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Seller</span>
                    <span className="text-gray-400 font-mono">{listing.seller}</span>
                  </div>
                </div>

                {/* Price & Details */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Price</span>
                    <div className="text-right">
                      <p className="text-xl font-mono font-semibold text-white">
                        {formatPrice(listing.price)}
                      </p>
                      <p className={`text-xs flex items-center gap-1 ${
                        listing.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {listing.change24h >= 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {Math.abs(listing.change24h)}% 24h
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Quantity</span>
                    <span className="text-white font-mono">
                      {formatQuantity(listing.quantity)} tokens
                    </span>
                  </div>

                  {listing.type === 'auction' && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Current Bid</span>
                      <span className="text-white font-mono">
                        {formatPrice(listing.currentBid || 0)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="text-lg font-mono font-semibold text-white">
                      {formatPrice(listing.price * listing.quantity)}
                    </span>
                  </div>

                  {listing.expiresAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      Ends {listing.expiresAt}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => handleBuy(listing.id, listing.price, listing.quantity)}
                    disabled={!account}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all
                      ${account
                        ? 'bg-accent-primary text-white hover:bg-accent-hover cursor-pointer'
                        : 'bg-white/10 text-gray-500 cursor-not-allowed'
                      }
                    `}
                    data-testid={`buy-button-${listing.id}`}
                  >
                    {account ? (
                      <>
                        {listing.type === 'fixed' ? 'Buy Now' : 'Place Bid'}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      'Connect Wallet'
                    )}
                  </button>
                  <button 
                    className="p-3 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 rounded-lg transition-colors"
                    data-testid={`view-listing-${listing.id}`}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <div className="space-y-4">
            {mockOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-surface border border-white/10 p-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-elevated rounded-lg flex items-center justify-center text-2xl">
                    {offer.image}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {offer.startupName} (${offer.symbol})
                    </h3>
                    <p className="text-sm text-gray-500">
                      Offer from {offer.buyer} • {formatQuantity(offer.quantity)} tokens
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-mono font-semibold text-white">
                      {formatPrice(offer.price)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Expires {offer.expiresAt}
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="text-center py-20 text-gray-500">
            <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Transaction history coming soon</p>
          </div>
        )}

        {/* Empty State */}
        {activeTab === 'listings' && filteredListings.length === 0 && (
          <div className="text-center py-20">
            <Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No listings found</h3>
            <p className="text-gray-400">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
