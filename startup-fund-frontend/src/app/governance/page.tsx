'use client';

import { AppShell } from '@/components/AppShell';
import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react';
import { useState } from 'react';
import { 
  Wallet, 
  Vote,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_IDS } from '@/lib/dapp-kit';

// Mock proposals
const mockProposals = [
  {
    id: '1',
    startupName: 'Nexus AI',
    symbol: 'NEXUS',
    title: 'Q2 2024 Fund Release - $500,000',
    description: 'Release funds for product development and team expansion.',
    type: 'fund_release',
    status: 'active',
    votesFor: 65,
    votesAgainst: 15,
    totalVoters: 156,
    endsAt: '2024-02-20',
    proposer: '0xstartup...owner',
    amount: 500000,
    image: '🤖',
  },
  {
    id: '2',
    startupName: 'GreenChain',
    symbol: 'GRCH',
    title: 'Partnership with CarbonChain Corp',
    description: 'Approve strategic partnership and token swap agreement.',
    type: 'partnership',
    status: 'active',
    votesFor: 82,
    votesAgainst: 8,
    totalVoters: 94,
    endsAt: '2024-02-18',
    proposer: '0xstartup...owner',
    amount: 0,
    image: '🌱',
  },
  {
    id: '3',
    startupName: 'MedVault',
    symbol: 'MVLT',
    title: 'Token Buyback Program',
    description: 'Allocate 10% of revenue for quarterly token buybacks.',
    type: 'governance',
    status: 'passed',
    votesFor: 340,
    votesAgainst: 45,
    totalVoters: 385,
    endsAt: '2024-02-10',
    proposer: '0xdao...member',
    amount: 0,
    image: '🏥',
  },
];

const mockUserVotes = {
  '1': 'for',
  '3': 'for',
};

export default function GovernancePage() {
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const [filter, setFilter] = useState<'all' | 'active' | 'passed' | 'failed'>('all');
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);

  const filteredProposals = mockProposals.filter((proposal) => {
    if (filter === 'all') return true;
    return proposal.status === filter;
  });

  const handleVote = async (proposalId: string, support: boolean) => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const tx = new Transaction();
      const packageId = PACKAGE_IDS['testnet'];

      tx.moveCall({
        target: `${packageId}::governance::vote`,
        arguments: [
          tx.object('0x0'), // governance
          tx.pure.id(proposalId),
          tx.pure.bool(support),
          tx.pure.u64(1000000000), // voting power
        ],
      });

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      
      if (result.$kind === 'FailedTransaction') {
        throw new Error(result.FailedTransaction.status.error?.message);
      }

      alert('Vote submitted successfully!');
    } catch (error) {
      console.error('Vote failed:', error);
      alert(`Vote failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-accent-primary/20 text-accent-primary';
      case 'passed':
        return 'bg-green-600/20 text-green-500';
      case 'failed':
        return 'bg-red-600/20 text-red-500';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'active':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <AppShell>
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl lg:text-4xl font-outfit font-medium text-white mb-4">
            Governance
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Participate in decentralized decision-making. Vote on proposals 
            to control fund releases and shape startup direction.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface border border-white/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Active Proposals</p>
            <p className="text-xl font-mono font-semibold text-white">
              {mockProposals.filter(p => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-surface border border-white/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Your Votes</p>
            <p className="text-xl font-mono font-semibold text-white">
              {Object.keys(mockUserVotes).length}
            </p>
          </div>
          <div className="bg-surface border border-white/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Proposals</p>
            <p className="text-xl font-mono font-semibold text-white">
              {mockProposals.length}
            </p>
          </div>
          <div className="bg-surface border border-white/10 p-4">
            <p className="text-sm text-gray-500 mb-1">Your Voting Power</p>
            <p className="text-xl font-mono font-semibold text-accent-primary">
              {account ? '1,250' : '—'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'active', 'passed', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize
                ${filter === status
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface border border-white/10 text-gray-400 hover:text-white'
                }
              `}
              data-testid={`filter-${status}`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          {filteredProposals.map((proposal) => {
            const totalVotes = proposal.votesFor + proposal.votesAgainst;
            const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
            const hasVoted = mockUserVotes[proposal.id as keyof typeof mockUserVotes];

            return (
              <div
                key={proposal.id}
                className={`
                  bg-surface border transition-all duration-300
                  ${selectedProposal === proposal.id 
                    ? 'border-accent-primary' 
                    : 'border-white/10 hover:border-white/20'
                  }
                `}
                data-testid={`proposal-card-${proposal.id}`}
              >
                {/* Header */}
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => setSelectedProposal(
                    selectedProposal === proposal.id ? null : proposal.id
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface-elevated rounded-lg flex items-center justify-center text-xl">
                        {proposal.image}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          {proposal.startupName} (${proposal.symbol})
                        </p>
                        <h3 className="text-lg font-medium text-white font-outfit">
                          {proposal.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`
                        px-3 py-1 text-xs font-medium rounded flex items-center gap-1.5
                        ${getStatusColor(proposal.status)}
                      `}>
                        {getStatusIcon(proposal.status)}
                        <span className="capitalize">{proposal.status}</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {proposal.description}
                  </p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-500">{proposal.votesFor.toLocaleString()} FOR</span>
                      <span className="text-red-500">{proposal.votesAgainst.toLocaleString()} AGAINST</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-green-500 transition-all"
                        style={{ width: `${forPercentage}%` }}
                      />
                      <div 
                        className="bg-red-500 transition-all"
                        style={{ width: `${100 - forPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-6 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Vote className="w-4 h-4" />
                      {proposal.totalVoters} voters
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {proposal.status === 'active' 
                        ? `Ends ${proposal.endsAt}` 
                        : `Ended ${proposal.endsAt}`
                      }
                    </span>
                    {proposal.amount > 0 && (
                      <span className="text-accent-primary">
                        ${proposal.amount.toLocaleString()} at stake
                      </span>
                    )}
                  </div>

                  {hasVoted && (
                    <div className="mt-3 text-xs">
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded
                        ${hasVoted === 'for' 
                          ? 'bg-green-600/20 text-green-500' 
                          : 'bg-red-600/20 text-red-500'
                        }
                      `}>
                        You voted {hasVoted}
                      </span>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {selectedProposal === proposal.id && (
                  <div className="px-6 pb-6 border-t border-white/10 pt-4">
                    {/* Detailed Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-surface-elevated p-3">
                        <p className="text-xs text-gray-500 mb-1">For %</p>
                        <p className="text-lg font-mono font-semibold text-green-500">
                          {forPercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-surface-elevated p-3">
                        <p className="text-xs text-gray-500 mb-1">Against %</p>
                        <p className="text-lg font-mono font-semibold text-red-500">
                          {(100 - forPercentage).toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-surface-elevated p-3">
                        <p className="text-xs text-gray-500 mb-1">Total Votes</p>
                        <p className="text-lg font-mono font-semibold text-white">
                          {totalVotes.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-surface-elevated p-3">
                        <p className="text-xs text-gray-500 mb-1">Proposer</p>
                        <p className="text-sm font-mono text-gray-400 truncate">
                          {proposal.proposer}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {proposal.status === 'active' && (
                      <div className="flex gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(proposal.id, true);
                          }}
                          disabled={!account || !!hasVoted}
                          className={`
                            flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all
                            ${account && !hasVoted
                              ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                              : 'bg-white/10 text-gray-500 cursor-not-allowed'
                            }
                          `}
                          data-testid={`vote-for-${proposal.id}`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Vote For
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(proposal.id, false);
                          }}
                          disabled={!account || !!hasVoted}
                          className={`
                            flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all
                            ${account && !hasVoted
                              ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                              : 'bg-white/10 text-gray-500 cursor-not-allowed'
                            }
                          `}
                          data-testid={`vote-against-${proposal.id}`}
                        >
                          <ThumbsDown className="w-4 h-4" />
                          Vote Against
                        </button>
                        <button 
                          className="p-3 border border-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                          data-testid={`view-proposal-${proposal.id}`}
                        >
                          <ExternalLink className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {!account && (
                      <p className="text-center text-sm text-gray-500 py-2">
                        Connect your wallet to vote
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProposals.length === 0 && (
          <div className="text-center py-20">
            <Vote className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No proposals found</h3>
            <p className="text-gray-400">
              {filter === 'all' 
                ? 'No governance proposals yet' 
                : `No ${filter} proposals`
              }
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
