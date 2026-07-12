'use client';
import { useState, useEffect } from 'react';

export function RouteView() {
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from our /api/route endpoint with the actual user's facts
    // For this demonstration, we use a mocked deterministic payload reflecting the core engine's output
    setTimeout(() => {
      setRoute({
        id: 'rt_demo_1',
        focusActionId: 'action_1',
        steps: [
          { actionId: 'action_1', status: 'FOCUS', reasonCode: 'LEXICOGRAPHIC_FOCUS', rank: 1, title: 'Confirm user identity details', description: 'Validate the uploaded ID against the user profile.' },
          { actionId: 'action_2', status: 'PENDING', reasonCode: 'DEFAULT_RANKING', rank: 2, title: 'Approve application', description: 'Requires identity confirmation first.' },
          { actionId: 'action_3', status: 'BLOCKED', reasonCode: 'BLOCKED_BY_DEPENDENCY', rank: 3, title: 'Disburse funds', description: 'Blocked by application approval.' }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className="animate-pulse flex space-x-4">
      <div className="flex-1 space-y-6 py-1">
        <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded col-span-2"></div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded col-span-1"></div>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">Focus Action</h2>
      {route.steps.filter((s: any) => s.status === 'FOCUS').map((step: any) => (
        <div key={step.actionId} className="p-6 border-2 border-blue-500 rounded-xl bg-blue-50 dark:bg-blue-900/20 shadow-sm">
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">{step.title}</h3>
          <p className="mt-2 text-blue-800 dark:text-blue-200">{step.description}</p>
          <div className="mt-4 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Complete Action</button>
          </div>
          <p className="mt-4 text-xs font-mono text-blue-600/60 dark:text-blue-300/60">Reason: {step.reasonCode} | Rank: {step.rank}</p>
        </div>
      ))}

      <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200 mt-8">Up Next</h2>
      <div className="flex flex-col gap-4">
        {route.steps.filter((s: any) => s.status !== 'FOCUS').map((step: any) => (
          <div key={step.actionId} className={`p-5 border rounded-xl shadow-sm ${step.status === 'BLOCKED' ? 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 opacity-70' : 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{step.title}</h3>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">{step.description}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${step.status === 'BLOCKED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                {step.status}
              </span>
            </div>
            <p className="mt-4 text-xs font-mono text-zinc-500">Reason: {step.reasonCode} | Rank: {step.rank}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
