'use client';

import { useState } from 'react';
import { useMarketplace, formatPrice, getListingTypeName, getListingStatusName, LISTING_TYPES, LISTING_STATUS } from '@/hooks/useMarketplace';
import { SuiConnectButton } from './SuiConnectButton';

interface ListingCardProps {
  listing: {
    listing_id: string;
    name: string;
    description: string;
    seller: string;
    listing_type: number;
    current_price: string;
    highest_bid: string;
    highest_bidder: string | null;
    expires_at: number;
    status: number;
  };
  onBid?: (listingId: string) => void;
  onBuy?: (listingId: string) => void;
  onEndAuction?: (listingId: string) => void;
}

export function ListingCard({ listing, onBid, onBuy, onEndAuction }: ListingCardProps) {
  const isAuction = listing.listing_type === LISTING_TYPES.AUCTION;
  const isActive = listing.status === LISTING_STATUS.ACTIVE;
  const canBid = isAuction && isActive;
  const canBuy = !isAuction && isActive;
  
  // Calculate time remaining for auctions
  const expiresIn = listing.expires_at ? 
    Math.max(0, listing.expires_at - Date.now() / 1000 / 600) : null; // epochs to rough minutes
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <h3 className="font-semibold text-lg mb-2">{listing.name}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{listing.description}</p>
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-xs text-gray-500">Type</p>
          <p className="font-medium">{getListingTypeName(listing.listing_type)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <p className={`font-medium ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
            {getListingStatusName(listing.status)}
          </p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-xs text-gray-500">Current Price</p>
        <p className="text-xl font-bold text-sui-blue">{formatPrice(listing.current_price)}</p>
        {isAuction && listing.highest_bidder && (
          <p className="text-xs text-gray-500 mt-1">
            Highest bid: {formatPrice(listing.highest_bid)} by {listing.highest_bidder?.slice(0, 8)}...
          </p>
        )}
      </div>
      
      {canBid && (
        <button
          onClick={() => onBid?.(listing.listing_id)}
          className="w-full bg-sui-blue text-white py-2 rounded-lg hover:bg-blue-600 transition-colors mb-2"
        >
          Place Bid
        </button>
      )}
      
      {canBuy && (
        <button
          onClick={() => onBuy?.(listing.listing_id)}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors mb-2"
        >
          Buy Now
        </button>
      )}
      
      {canBid && onEndAuction && expiresIn !== null && expiresIn <= 0 && (
        <button
          onClick={() => onEndAuction?.(listing.listing_id)}
          className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          End Auction
        </button>
      )}
    </div>
  );
}

// ============ Place Bid Modal ============

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  currentPrice: string;
  highestBid?: string;
  highestBidder?: string;
  onSubmit: (amount: number) => Promise<void>;
}

export function BidModal({ isOpen, onClose, listingId, currentPrice, highestBid, highestBidder, onSubmit }: BidModalProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const minBid = Math.max(
    Number(currentPrice) / 1e9 + 0.001,
    highestBid ? Number(highestBid) / 1e9 + 0.001 : 0
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(parseFloat(amount));
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Place Bid</h2>
        
        {highestBidder && (
          <p className="text-sm text-gray-600 mb-4">
            Current highest bid: {formatPrice(highestBid || '0')} by {highestBidder.slice(0, 8)}...
          </p>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bid Amount (SUI)
            </label>
            <input
              type="number"
              step="0.001"
              min={minBid}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min: ${minBid.toFixed(3)} SUI`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sui-blue focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum bid: {minBid.toFixed(3)} SUI
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-sui-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={isSubmitting || !amount}
            >
              {isSubmitting ? 'Processing...' : 'Place Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ Create Listing Modal ============

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  startupId: string;
  startupName: string;
  onCreateAuction: (name: string, description: string, price: number, duration: number) => Promise<void>;
  onCreateFixedPrice: (name: string, description: string, price: number) => Promise<void>;
}

export function CreateListingModal({ 
  isOpen, 
  onClose, 
  startupId, 
  startupName,
  onCreateAuction,
  onCreateFixedPrice 
}: CreateListingModalProps) {
  const [listingType, setListingType] = useState<'auction' | 'fixed'>('fixed');
  const [name, setName] = useState(`${startupName} - NFT`);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('7'); // epochs
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price) return;
    
    setIsSubmitting(true);
    try {
      if (listingType === 'auction') {
        await onCreateAuction(name, description, parseFloat(price), parseInt(duration));
      } else {
        await onCreateFixedPrice(name, description, parseFloat(price));
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create Listing</h2>
        <p className="text-sm text-gray-600 mb-4">For: {startupName}</p>
        
        <form onSubmit={handleSubmit}>
          {/* Listing Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Listing Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="listingType"
                  value="fixed"
                  checked={listingType === 'fixed'}
                  onChange={() => setListingType('fixed')}
                  className="mr-2"
                />
                Fixed Price
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="listingType"
                  value="auction"
                  checked={listingType === 'auction'}
                  onChange={() => setListingType('auction')}
                  className="mr-2"
                />
                Auction
              </label>
            </div>
          </div>
          
          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Listing Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sui-blue focus:border-transparent"
              required
            />
          </div>
          
          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sui-blue focus:border-transparent"
            />
          </div>
          
          {/* Price */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (SUI)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sui-blue focus:border-transparent"
              required
            />
          </div>
          
          {/* Duration (auction only) */}
          {listingType === 'auction' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (epochs, ~1 epoch = 24h)
              </label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sui-blue focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {parseInt(duration || '7')} epochs ≈ {Math.round(parseInt(duration || '7') * 24)} hours
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-sui-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={isSubmitting || !price}
            >
              {isSubmitting ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ Wallet Required Wrapper ============

export function WalletRequired({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SuiConnectButton />
      {children}
    </>
  );
}

// ============ My Listings Component ============

interface MyListingsProps {
  listings: any[];
  userAddress?: string;
  onWithdraw?: (listingId: string) => void;
}

export function MyListings({ listings, userAddress, onWithdraw }: MyListingsProps) {
  const myListings = listings.filter(l => l.seller === userAddress);
  
  if (myListings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>You have no active listings.</p>
        <p className="text-sm mt-2">Create one from a startup page.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {myListings.map(listing => (
        <ListingCard
          key={listing.listing_id}
          listing={listing}
        />
      ))}
    </div>
  );
}

// ============ My Bids Component ============

interface MyBidsProps {
  listings: any[];
  userAddress?: string;
  onEndAuction?: (listingId: string) => void;
}

export function MyBids({ listings, userAddress, onEndAuction }: MyBidsProps) {
  const myBids = listings.filter(l => l.highest_bidder === userAddress && l.status === LISTING_STATUS.ACTIVE);
  
  if (myBids.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>You have no active bids.</p>
        <p className="text-sm mt-2">Browse listings to place bids.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {myBids.map(listing => (
        <div key={listing.listing_id} className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Highest Bidder</span>
            <span className="text-sm text-gray-500">#{listing.listing_id.slice(0, 8)}</span>
          </div>
          <h3 className="font-semibold">{listing.name}</h3>
          <p className="text-lg font-bold text-green-700 mt-2">
            {formatPrice(listing.current_price)}
          </p>
          {listing.listing_type === LISTING_TYPES.AUCTION && listing.expires_at && (
            <p className="text-xs text-gray-500 mt-2">
              Ends at epoch {listing.expires_at}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
