'use client';

import { useState, useRef, useEffect } from 'react';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AnalysisReport {
  startupName: string;
  score: number;
  strengths: string[];
  risks: string[];
  analysis: {
    whitepaper: string;
    pitchDeck: string;
    github: string;
    team: string;
    social: string;
  };
  history: { month: string; score: number }[];
  reportHash?: string;
}

// Sandra's avatar SVG
const SandraAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  </div>
);

// User avatar
const UserAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  </div>
);

// Score gauge component
const ScoreGauge = ({ score }: { score: number }) => {
  const getColor = (s: number) => {
    if (s >= 75) return 'text-emerald-400';
    if (s >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-slate-700"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={getColor(score)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getColor(score)}`}>{score}</span>
        <span className="text-xs text-slate-400">/100</span>
      </div>
    </div>
  );
};

// Score history chart
const ScoreHistory = ({ history }: { history: { month: string; score: number }[] }) => {
  const maxScore = Math.max(...history.map(h => h.score), 100);
  
  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-slate-300 mb-3">Score History</h4>
      <div className="flex items-end gap-2 h-24">
        {history.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t"
              style={{ height: `${(item.score / maxScore) * 100}%` }}
            />
            <span className="text-xs text-slate-500 mt-1">{item.month}</span>
            <span className="text-xs font-medium text-violet-400">{item.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Analysis card
const AnalysisCard = ({ title, content, icon }: { title: string; content: string; icon: string }) => (
  <div className="bg-slate-800/50 rounded-lg p-3">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-lg">{icon}</span>
      <h4 className="text-sm font-medium text-slate-300">{title}</h4>
    </div>
    <p className="text-sm text-slate-400 leading-relaxed">{content}</p>
  </div>
);

// Report display
const AnalysisReport = ({ report }: { report: AnalysisReport }) => (
  <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
    {/* Header */}
    <div className="bg-gradient-to-r from-violet-900/50 to-purple-900/50 p-4 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{report.startupName}</h3>
          <p className="text-sm text-slate-400">AI Due Diligence Report by Sandra</p>
        </div>
        {report.reportHash && (
          <div className="text-xs text-slate-500 font-mono">
            Hash: {report.reportHash.slice(0, 8)}...
          </div>
        )}
      </div>
    </div>

    <div className="p-4 space-y-4">
      {/* Score Section */}
      <div className="flex items-center gap-6">
        <ScoreGauge score={report.score} />
        <div className="flex-1 space-y-2">
          <div>
            <h4 className="text-sm font-medium text-emerald-400 mb-1">Strengths</h4>
            <ul className="space-y-1">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <h4 className="text-sm font-medium text-red-400 mb-1">Risks</h4>
            <ul className="space-y-1">
              {report.risks.map((r, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                  <span className="text-red-400">⚠</span> {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Analysis Details */}
      <div className="grid grid-cols-2 gap-3">
        <AnalysisCard 
          title="Whitepaper" 
          content={report.analysis.whitepaper}
          icon="📄"
        />
        <AnalysisCard 
          title="Pitch Deck" 
          content={report.analysis.pitchDeck}
          icon="📊"
        />
        <AnalysisCard 
          title="GitHub" 
          content={report.analysis.github}
          icon="💻"
        />
        <AnalysisCard 
          title="Team" 
          content={report.analysis.team}
          icon="👥"
        />
      </div>

      {/* Social */}
      <div className="bg-slate-800/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📱</span>
          <h4 className="text-sm font-medium text-slate-300">Social Presence</h4>
        </div>
        <p className="text-sm text-slate-400">{report.analysis.social}</p>
      </div>

      {/* Score History */}
      {report.history.length > 0 && (
        <ScoreHistory history={report.history} />
      )}
    </div>
  </div>
);

// Typing indicator
const TypingIndicator = () => (
  <div className="flex items-start gap-3">
    <SandraAvatar />
    <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

// Sample analysis for demo
const generateSampleAnalysis = (startupName: string): AnalysisReport => ({
  startupName,
  score: Math.floor(Math.random() * 30) + 60,
  strengths: [
    'Strong technical team with proven track record',
    'Working MVP with positive user feedback',
    'Clear go-to-market strategy',
    'Active community engagement',
  ],
  risks: [
    'No significant revenue yet',
    'Competitive market landscape',
    'Regulatory uncertainty in target market',
  ],
  analysis: {
    whitepaper: 'Comprehensive whitepaper with clear tokenomics and use cases. Technical architecture is sound.',
    pitchDeck: 'Professional presentation with realistic projections. Strong market opportunity identified.',
    github: 'Active repository with 234 commits in last 30 days. Good test coverage at 78%.',
    team: '5 founding members with combined 40+ years in tech. 2 PhDs in AI/ML.',
    social: 'Growing Twitter following (12K), active Discord (5K members), weekly updates.',
  },
  history: [
    { month: 'Jan', score: 62 },
    { month: 'Feb', score: 70 },
    { month: 'Mar', score: 83 },
  ],
  reportHash: '0x' + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10),
});

// Sandra's system prompt
const SANDRA_PROMPT = `You are Sandra, an AI Due Diligence Analyst for startup investments on the Sui blockchain.

Your expertise:
- Analyzing whitepapers, pitch decks, and technical documentation
- Evaluating team backgrounds and track records
- Assessing GitHub activity and code quality
- Monitoring social media presence and community growth
- Providing investment risk scores (0-100)

When analyzing a startup, provide:
1. An overall risk score
2. Key strengths
3. Potential risks
4. Detailed analysis of each area

You have access to on-chain data and can track funding progress. Reports are stored as hashes on-chain for transparency.

Format your responses clearly and professionally. Always be objective and data-driven.`;

export function SandraChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm Sandra, your AI Due Diligence Analyst. 👋

I help investors evaluate startups by analyzing:
- 📄 Whitepapers & pitch decks
- 💻 GitHub activity & code quality  
- 👥 Team backgrounds
- 📱 Social presence & growth
- 📊 Funding progress

I provide risk scores and track changes over time. Reports are stored on-chain for transparency.

Which startup would you like me to analyze? Just share a name or project details.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate Sandra's response
    setTimeout(() => {
      const startupName = input.trim();
      
      // Check if user wants to analyze a startup
      const isAnalysisRequest = !startupName.toLowerCase().includes('how') && 
                                !startupName.toLowerCase().includes('what') &&
                                !startupName.toLowerCase().includes('?');

      if (isAnalysisRequest) {
        const report = generateSampleAnalysis(startupName);
        setCurrentReport(report);
        setShowReport(true);

        const response: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've completed the due diligence analysis for "${startupName}". Here's what I found:

**Risk Score: ${report.score}/100** ${report.score >= 75 ? '🟢' : report.score >= 50 ? '🟡' : '🔴'}

**Key Strengths:**
${report.strengths.map(s => `• ${s}`).join('\n')}

**Potential Risks:**
${report.risks.map(r => `• ${r}`).join('\n')}

The full analysis is shown below. I track this startup's progress and will update the score as new data becomes available.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, response]);
      } else {
        const response: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Great question! Here's how I work:

**My Analysis Process:**
1. **Document Review** - I analyze whitepapers and pitch decks for clarity, feasibility, and market fit
2. **Code Analysis** - I check GitHub for activity, quality, and technical soundness
3. **Team Evaluation** - I verify team credentials and past achievements
4. **Social Intelligence** - I monitor community growth and engagement
5. **On-Chain Tracking** - I follow funding rounds and token metrics

**Score Ranges:**
• 75-100: Strong investment potential 🟢
• 50-74: Moderate risk, further due diligence needed 🟡
• 0-49: High risk or insufficient data 🔴

Every report is hashed and stored on-chain for transparent record-keeping.

Would you like me to analyze a specific startup?`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, response]);
      }

      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Sandra</h1>
            <p className="text-xs text-slate-400">AI Due Diligence Analyst</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">Online</span>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {msg.role === 'assistant' ? <SandraAvatar /> : <UserAvatar />}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-xs opacity-60 mt-1 block">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isTyping && <TypingIndicator />}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Sandra about any startup..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
              >
                {isTyping ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Report sidebar */}
        {showReport && currentReport && (
          <div className="w-96 border-l border-slate-700/50 bg-slate-900/50 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-300">Analysis Report</h2>
                <button
                  onClick={() => setShowReport(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AnalysisReport report={currentReport} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
