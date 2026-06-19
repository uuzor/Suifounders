'use client';

import { AppShell } from '@/components/AppShell';
import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react';
import { useState } from 'react';
import { 
  Search, 
  TrendingUp, 
  Users, 
  DollarSign,
  Filter,
  ChevronRight,
  Building2,
  ExternalLink
} from 'lucide-react';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_IDS } from '@/lib/dapp-kit';

// Mock data for startups
const mockStartups = [
  {
    id: '1',
    name: 'Nexus AI',
    symbol: 'NEXUS',
    description: 'AI-powered supply chain optimization platform for enterprise logistics.',
    category: 'AI/ML',
    fundingGoal: 5000000,
    raised: 3250000,
    investors: 234,
    tokenPrice: 2.50,
    status: 'active',
    image: '🤖',
  },
  {
    id: '2',
    name: 'GreenChain',
    symbol: 'GRCH',
    description: 'Sustainable blockchain infrastructure for carbon credit trading.',
    category: 'ClimateTech',
    fundingGoal: 3000000,
    raised: 2100000,
    investors: 156,
    tokenPrice: 1.75,
    status: 'active',
    image: '🌱',
  },
  {
    id: '3',
    name: 'MedVault',
    symbol: 'MVLT',
    description: 'Decentralized health records management with patient ownership.',
    category: 'HealthTech',
    fundingGoal: 4000000,
    raised: 4000000,
    investors: 412,
    tokenPrice: 3.20,
    status: 'funded',
    image: '🏥',
  },
  {
    id: '4',
    name: 'FinanceFlow',
    symbol: 'FINF',
    description: 'Real-time cross-border payment settlement for SMBs.',
    category: 'FinTech',
    fundingGoal: 2500000,
    raised: 890000,
    investors: 89,
    tokenPrice: 1.25,
    status: 'active',
    image: '💳',
  },
];

const categories = ['All', 'AI/ML', 'FinTech', 'HealthTech', 'ClimateTech', 'Web3'];

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

export default function DiscoverPage() {
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filter, setFilter] = useState<'all' | 'active' | 'funded'>('all');

  const filteredStartups = mockStartups.filter((startup) => {
    const matchesSearch = startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || startup.category === selectedCategory;
    const matchesFilter = filter === 'all' || startup.status === filter;
    return matchesSearch && matchesCategory && matchesFilter;
  });

  const handleInvest = async (startupId: string, amount: number) => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const tx = new Transaction();
      const packageId = PACKAGE_IDS['testnet'];

      tx.moveCall({
        target: `${packageId}::funding_pool::deposit`,
        arguments: [
          tx.object('0x0'),
          tx.splitCoins(tx.gas, [tx.pure.u64(amount * 1_000_000_000)]),
        ],
      });

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      
      if (result.$kind === 'FailedTransaction') {
        throw new Error(result.FailedTransaction.status.error?.message);
      }

      alert('Investment successful!');
    } catch (error) {
      console.error('Investment failed:', error);
      alert(`Investment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <AppShell>
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl lg:text-4xl font-outfit font-medium text-white mb-4">
            Discover Startups
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Explore tokenized startups raising capital on-chain. 
            Invest in the next generation of innovative companies.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search startups or symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-white/10 pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-accent-primary transition-colors"
              data-testid="discover-search"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors
                  ${selectedCategory === category 
                    ? 'bg-accent-primary text-white' 
                    : 'bg-surface border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }
                `}
                data-testid={`filter-category-${category.toLowerCase()}`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${filter === 'all' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${filter === 'active' 
                  ? 'bg-accent-primary text-white' 
                  : 'bg-surface border border-white/10 text-gray-400 hover:text-white'
                }
              `}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('funded')}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${filter === 'funded' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-surface border border-white/10 text-gray-400 hover:text-white'
                }
              `}
            >
              Funded
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface border border-white/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Raised</p>
            <p className="text-xl font-mono font-semibold text-white">$10.2M</p>
          </div>
          <div className="bg-surface border border-white/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Active Startups</p>
            <p className="text-xl font-mono font-semibold text-white">42</p>
          </div>
          <div className="bg-surface border border-white/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Investors</p>
            <p className="text-xl font-mono font-semibold text-white">8.5K</p>
          </div>
          <div className="bg-surface border border-white/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Avg. Raise</p>
            <p className="text-xl font-mono font-semibold text-white">$2.4M</p>
          </div>
        </div>

        {/* Startup Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStartups.map((startup) => {
            const progress = (startup.raised / startup.fundingGoal) * 100;
            
            return (
              <div
                key={startup.id}
                className="bg-surface border border-white/10 hover:border-white/20 transition-all duration-300 group"
                data-testid={`startup-card-${startup.id}`}
              >
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-surface-elevated rounded-lg flex items-center justify-center text-2xl">
                        {startup.image}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white font-outfit">
                          {startup.name}
                        </h3>
                        <p className="text-sm text-accent-primary font-mono">
                          ${startup.symbol}
                        </p>
                      </div>
                    </div>
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded
                      ${startup.status === 'active' 
                        ? 'bg-accent-primary/20 text-accent-primary' 
                        : 'bg-green-600/20 text-green-500'
                      }
                    `}>
                      {startup.status === 'funded' ? 'Funded' : 'Active'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {startup.description}
                  </p>
                  <span className="inline-block mt-3 px-2 py-1 text-xs font-medium bg-white/5 text-gray-400 rounded">
                    {startup.category}
                  </span>
                </div>

                {/* Stats */}
                <div className="p-6 space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">
                        {formatCurrency(startup.raised)} raised
                      </span>
                      <span className="text-white font-mono">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          startup.status === 'funded' ? 'bg-green-500' : 'bg-accent-primary'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Goal: {formatCurrency(startup.fundingGoal)}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-mono font-medium text-white">
                        ${startup.tokenPrice}
                      </p>
                      <p className="text-xs text-gray-500">Per token</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <Users className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-mono font-medium text-white">
                        {startup.investors}
                      </p>
                      <p className="text-xs text-gray-500">Investors</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-mono font-medium text-white">
                        {((startup.tokenPrice / 1 - 1) * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">Gain</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => handleInvest(startup.id, 100)}
                    disabled={!account || startup.status === 'funded'}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all
                      ${account && startup.status !== 'funded'
                        ? 'bg-accent-primary text-white hover:bg-accent-hover cursor-pointer'
                        : 'bg-white/10 text-gray-500 cursor-not-allowed'
                      }
                    `}
                    data-testid={`invest-button-${startup.id}`}
                  >
                    {account ? 'Invest Now' : 'Connect Wallet'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-3 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 rounded-lg transition-colors"
                    data-testid={`view-button-${startup.id}`}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredStartups.length === 0 && (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No startups found</h3>
            <p className="text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
