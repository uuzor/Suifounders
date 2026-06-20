'use client';

import { AppShell } from '@/components/AppShell';
import { SandraChat } from '@/components/ai/SandraChat';

export default function AIAnalystPage() {
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Due Diligence</h1>
          <p className="text-slate-400">
            Let Sandra analyze any startup for investment risks and opportunities.
          </p>
        </div>
        <div className="h-[calc(100vh-16rem)] bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
          <SandraChat />
        </div>
      </div>
    </AppShell>
  );
}
