'use client';
import { useState, useEffect } from 'react';

export function RouteView() {
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRoute = async () => {
    try {
      const res = await fetch('/api/route');
      const data = await res.json();
      if (data.route) {
        setRoute(data.route);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, []);

  const handleExtract = async () => {
    if (!inputText.trim()) return;
    setProcessing(true);
    try {
      // 1. Extract facts via AI
      const extractRes = await fetch('/api/ai/extract', {
        method: 'POST',
        body: JSON.stringify({ text: inputText })
      });
      const extractData = await extractRes.json();
      
      // 2. Propose and confirm them (simplified for E2E flow)
      for (const fact of extractData.facts || []) {
        await fetch('/api/facts', {
          method: 'POST',
          body: JSON.stringify({
            action: 'propose',
            payload: fact,
            provenance: { source: 'ai_extraction', confidence: fact.confidence }
          })
        });
      }

      // 3. Refresh route
      await fetchRoute();
      setInputText('');
    } catch (e) {
      console.error("Extraction failed", e);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-4">
      <div className="flex-1 space-y-6 py-1">
        <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      </div>
    </div>;
  }

  const focusSteps = route?.steps?.filter((s: any) => s.status === 'FOCUS') || [];
  const otherSteps = route?.steps?.filter((s: any) => s.status !== 'FOCUS') || [];

  return (
    <div className="flex flex-col gap-6">
      
      <div className="p-6 border rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Ingest Information</h3>
        <textarea 
          className="w-full p-3 border rounded-lg bg-zinc-50 dark:bg-black border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100" 
          rows={3}
          placeholder="Paste emails, documents, or notes here. AI will extract facts..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <div className="mt-3 flex justify-end">
          <button 
            disabled={processing || !inputText.trim()}
            onClick={handleExtract}
            className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 transition"
          >
            {processing ? 'Extracting...' : 'Extract & Process'}
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">Focus Action</h2>
      {focusSteps.length === 0 && (
        <p className="text-zinc-500 italic">No focus action available. Ingest more information.</p>
      )}
      {focusSteps.map((step: any) => (
        <div key={step.actionId} className="p-6 border-2 border-blue-500 rounded-xl bg-blue-50 dark:bg-blue-900/20 shadow-sm">
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">{step.actionId}</h3>
          <p className="mt-2 text-blue-800 dark:text-blue-200">Current active objective determined by deterministic engine.</p>
          <div className="mt-4 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Complete Action</button>
          </div>
          <p className="mt-4 text-xs font-mono text-blue-600/60 dark:text-blue-300/60">Reason: {step.reasonCode} | Rank: {step.rank}</p>
        </div>
      ))}

      <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200 mt-8">Up Next</h2>
      <div className="flex flex-col gap-4">
        {otherSteps.map((step: any) => (
          <div key={step.actionId} className={`p-5 border rounded-xl shadow-sm ${step.status === 'BLOCKED' ? 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 opacity-70' : 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{step.actionId}</h3>
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
