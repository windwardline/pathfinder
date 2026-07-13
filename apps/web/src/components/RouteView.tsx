'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle2, Lock, ArrowRight, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RouteView() {
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [completingActionId, setCompletingActionId] = useState<string | null>(null);

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
      const extractRes = await fetch('/api/ai/extract', {
        method: 'POST',
        body: JSON.stringify({ text: inputText })
      });
      const extractData = await extractRes.json();
      
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

      await fetchRoute();
      setInputText('');
    } catch (e) {
      console.error("Extraction failed", e);
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async (actionId: string) => {
    setCompletingActionId(actionId);
    try {
      await fetch('/api/actions/complete', {
        method: 'POST',
        body: JSON.stringify({ actionId })
      });
      await fetchRoute();
    } catch (e) {
      console.error("Completion failed", e);
    } finally {
      setCompletingActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const focusSteps = route?.steps?.filter((s: any) => s.status === 'FOCUS') || [];
  const otherSteps = route?.steps?.filter((s: any) => s.status !== 'FOCUS' && s.status !== 'COMPLETED') || [];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      
      {/* Left Column: Command Center */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6 sticky top-8">
        <div className="p-6 rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Command Center</h3>
          </div>
          
          <textarea 
            className="w-full min-h-[120px] p-4 rounded-xl bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all relative z-10 text-sm leading-relaxed" 
            placeholder="Paste emails, tickets, or meeting notes here. The AI will extract structural facts and recalculate your deterministic route."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          
          <div className="mt-4 flex justify-end relative z-10">
            <button 
              disabled={processing || !inputText.trim()}
              onClick={handleExtract}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-black/5 dark:shadow-white/5"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Process Input
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Timeline */}
      <div className="w-full lg:w-2/3 flex flex-col">
        <AnimatePresence mode="popLayout">
          
          {/* FOCUS ACTION */}
          {focusSteps.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center text-zinc-500 min-h-[200px]"
            >
              <CheckCircle2 className="w-12 h-12 mb-4 text-zinc-300 dark:text-zinc-700" />
              <p>No active steps. You're fully caught up.</p>
              <p className="text-sm mt-1">Ingest new information to generate routes.</p>
            </motion.div>
          ) : (
            focusSteps.map((step: any) => (
              <motion.div 
                layoutId={step.actionId}
                key={step.actionId}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
                className="relative p-1 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-indigo-500/20 mb-12"
              >
                <div className="bg-white dark:bg-zinc-950 p-8 rounded-[1.35rem] relative overflow-hidden">
                  {/* Focus Glow Background */}
                  <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full" />
                  
                  <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      Focus Action
                    </span>
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 leading-tight">
                    {step.actionId}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-lg">
                    This step is unblocked and deterministically ranked as your top priority.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <button 
                      onClick={() => handleComplete(step.actionId)}
                      disabled={completingActionId === step.actionId}
                      className="group flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all active:scale-95 disabled:opacity-70"
                    >
                      {completingActionId === step.actionId ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Mark as Complete
                          <ArrowRight className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </>
                      )}
                    </button>
                    
                    <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
                      Rank: {step.rank} • Code: {step.reasonCode}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {/* UP NEXT TIMELINE */}
          {otherSteps.length > 0 && (
            <div className="relative pl-6 sm:pl-8">
              {/* Timeline Track */}
              <div className="absolute left-0 top-6 bottom-6 w-px bg-gradient-to-b from-zinc-300 via-zinc-200 to-transparent dark:from-zinc-700 dark:via-zinc-800 dark:to-transparent" />
              
              <div className="space-y-6">
                {otherSteps.map((step: any, idx: number) => {
                  const isBlocked = step.status === 'BLOCKED';
                  return (
                    <motion.div 
                      layoutId={step.actionId}
                      key={step.actionId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "relative p-5 rounded-2xl border bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm transition-colors",
                        isBlocked 
                          ? "border-zinc-200 dark:border-white/5 opacity-60" 
                          : "border-zinc-300 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-indigo-500/50"
                      )}
                    >
                      {/* Timeline Node */}
                      <div className={cn(
                        "absolute -left-6 sm:-left-8 top-1/2 -translate-y-1/2 -ml-[4px] w-[9px] h-[9px] rounded-full border-2",
                        isBlocked ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700" : "bg-white dark:bg-black border-indigo-500"
                      )} />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {isBlocked && <Lock className="w-4 h-4 text-zinc-400" />}
                          <h4 className={cn(
                            "text-lg font-semibold",
                            isBlocked ? "text-zinc-500 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100"
                          )}>
                            {step.actionId}
                          </h4>
                        </div>
                        
                        <span className={cn(
                          "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest w-fit",
                          isBlocked 
                            ? "bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-400" 
                            : "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                        )}>
                          {step.status}
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-mono text-zinc-400">Reason: {step.reasonCode} • Rank: {step.rank}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
