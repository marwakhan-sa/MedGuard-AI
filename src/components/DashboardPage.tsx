import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Pill, 
  Plus, 
  X, 
  ShieldAlert, 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  HelpCircle,
  Play,
  HeartPulse,
  Brain,
  History
} from "lucide-react";
import { Medication, PairwiseInteraction, AiRiskSummary } from "../types";

interface DashboardPageProps {
  onStartAnalysis: (meds: Medication[], interactions: PairwiseInteraction[], aiSummary: AiRiskSummary) => void;
  savedMedications: Medication[];
  onSaveMedsLocally: (meds: Medication[]) => void;
}

// 2 predefined demo presets so caregivers can instantly test the app safely
const PRESETS = [
  {
    title: "Cardiopulmonary Regimen",
    description: "Heart & blood pressure medications often prescribed together but possessing severe blood-thinning interaction risks.",
    drugs: [
      { name: "Warfarin", rxcui: "11289" },
      { name: "Aspirin", rxcui: "1191" },
      { name: "Ibuprofen", rxcui: "5640" },
      { name: "Lisinopril", rxcui: "29046" }
    ]
  },
  {
    title: "Neurological & Pain Regimen",
    description: "Anxiety and chronic pain regimen carrying high risk of cumulative central nervous system (CNS) depression.",
    drugs: [
      { name: "Tramadol", rxcui: "10689" },
      { name: "Xanax", rxcui: "11170" },
      { name: "Sertraline", rxcui: "36437" }
    ]
  }
];

export default function DashboardPage({ 
  onStartAnalysis, 
  savedMedications, 
  onSaveMedsLocally 
}: DashboardPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Medication[]>([]);
  const [activeMeds, setActiveMeds] = useState<Medication[]>(savedMedications);
  const [isSearching, setIsSearching] = useState(false);
  
  // Interaction and AI analysis states
  const [analysisState, setAnalysisState] = useState<"idle" | "checking_rxnav" | "consulting_gemini" | "finalizing" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Sync state to local storage when activeMeds changes
  useEffect(() => {
    onSaveMedsLocally(activeMeds);
  }, [activeMeds]);

  // Handle outside clicks to close autocomplete
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search fetch
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/drugs/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Failed to fetch autocomplete suggestions", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleAddMed = (med: Medication) => {
    // Avoid duplicates
    if (activeMeds.some(m => m.rxcui === med.rxcui)) {
      setSearchQuery("");
      setSuggestions([]);
      return;
    }
    setActiveMeds([...activeMeds, med]);
    setSearchQuery("");
    setSuggestions([]);
  };

  const handleRemoveMed = (rxcui: string) => {
    setActiveMeds(activeMeds.filter(m => m.rxcui !== rxcui));
  };

  const handleApplyPreset = (presetDrugs: Medication[]) => {
    setActiveMeds(presetDrugs);
  };

  const handleClearAll = () => {
    setActiveMeds([]);
  };

  // Perform pairwise interaction check and Gemini AI analysis
  const handleAnalyze = async () => {
    if (activeMeds.length === 0) return;
    setErrorMessage(null);
    
    // Step 1: Checking RxNav
    setAnalysisState("checking_rxnav");

    try {
      // Build rxcuis query parameter
      const rxcuisString = activeMeds.map(m => m.rxcui).join("+");
      const rxnavRes = await fetch(`/api/drugs/interactions?rxcuis=${rxcuisString}`);
      if (!rxnavRes.ok) {
        let errMessage = "Failed to cross-reference medications.";
        try {
          const errData = await rxnavRes.json();
          if (errData?.error) {
            errMessage = errData.error;
          }
        } catch (_) {}
        throw new Error(errMessage);
      }
      
      const rxnavData = await rxnavRes.json();
      const pairwiseInteractions = rxnavData.interactions || [];

      // Step 2: Consulting Gemini
      setAnalysisState("consulting_gemini");

      const geminiRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medications: activeMeds,
          interactions: pairwiseInteractions
        })
      });

      if (!geminiRes.ok) {
        const errJson = await geminiRes.json();
        throw new Error(errJson.error || "Gemini synthesis failed.");
      }

      const geminiResult: AiRiskSummary = await geminiRes.json();

      // Step 3: Finalizing
      setAnalysisState("finalizing");
      
      // Delay slightly for smooth transitions
      setTimeout(() => {
        onStartAnalysis(activeMeds, pairwiseInteractions, geminiResult);
        setAnalysisState("idle");
      }, 800);

    } catch (err: any) {
      console.error("Regimen analysis failed:", err);
      setErrorMessage(err.message || "An unexpected error occurred during analysis. Please try again.");
      setAnalysisState("error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative min-h-[calc(100vh-68px)]">
      {/* Loading Overlay */}
      <AnimatePresence>
        {analysisState !== "idle" && analysisState !== "error" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6"
          >
            {/* Pulsing Pill Graphic */}
            <div className="relative mb-8">
              <motion.div 
                animate={{ 
                  scale: [1, 1.15, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-20 h-20 rounded-2xl bg-teal-600 flex items-center justify-center p-5 shadow-lg shadow-teal-600/30"
              >
                <Pill className="w-10 h-10 text-white" />
              </motion.div>
              {/* Outer pulsing glow */}
              <div className="absolute inset-0 bg-teal-500/10 rounded-full filter blur-xl animate-ping" />
            </div>

            {/* Step messages */}
            <div className="max-w-md">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
                {analysisState === "checking_rxnav" && "Checking NLM Database..."}
                {analysisState === "consulting_gemini" && "Consulting Gemini AI..."}
                {analysisState === "finalizing" && "Preparing Safety Brief..."}
              </h3>
              
              <motion.p 
                key={analysisState}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs md:text-sm text-slate-500 font-semibold"
              >
                {analysisState === "checking_rxnav" && "Cross-referencing 75,000+ active clinical drug interactions at NIH RxNav..."}
                {analysisState === "consulting_gemini" && "Running safety rules, assessing cumulative side effects & generating patient briefs..."}
                {analysisState === "finalizing" && "Formatting interactive severity reports, questions checklist & medical metrics..."}
              </motion.p>
            </div>

            {/* Visual step indicators */}
            <div className="flex items-center space-x-6 mt-10">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border transition-colors ${
                  analysisState === "checking_rxnav" 
                    ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20" 
                    : "bg-teal-50 text-teal-600 border-teal-100"
                }`}>
                  <HeartPulse className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-400 mt-2 font-bold tracking-widest uppercase">1. NIH RxNav</span>
              </div>
              <div className="h-[2px] w-8 bg-slate-100"></div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border transition-colors ${
                  analysisState === "consulting_gemini" 
                    ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20" 
                    : "bg-slate-50 text-slate-400 border-slate-200"
                }`}>
                  <Brain className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-400 mt-2 font-bold tracking-widest uppercase">2. Gemini API</span>
              </div>
              <div className="h-[2px] w-8 bg-slate-100"></div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border transition-colors ${
                  analysisState === "finalizing" 
                    ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20" 
                    : "bg-slate-50 text-slate-400 border-slate-200"
                }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-400 mt-2 font-bold tracking-widest uppercase">3. Synthesis</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Form content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Autocomplete search input & Active medications */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2.5 mb-1">
              <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 border border-teal-100">
                <Pill className="w-5 h-5" />
              </div>
              <span>Medication Regimen Checker</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6 pl-11">
              Enter prescription, OTC, or supplement names below. Add multiple medications to check overlapping and cumulative risks.
            </p>

            {/* Error state */}
            {errorMessage && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                <div className="flex-1">
                  <p className="font-bold">Analysis Failed</p>
                  <p className="text-rose-600 mt-0.5">{errorMessage}</p>
                </div>
                <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Autocomplete Input Container */}
            <div ref={autocompleteRef} className="relative z-30">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type a drug name (e.g. Lisinopril, Warfarin, Aspirin...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 animate-spin" />
                )}
              </div>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl z-40 max-h-60 overflow-y-auto"
                  >
                    {suggestions.map((med) => {
                      const alreadyAdded = activeMeds.some(m => m.rxcui === med.rxcui);
                      return (
                        <button
                          key={med.rxcui}
                          type="button"
                          onClick={() => handleAddMed(med)}
                          disabled={alreadyAdded}
                          className="w-full px-4 py-3 text-left text-xs md:text-sm text-slate-700 hover:bg-slate-50 hover:text-teal-700 flex items-center justify-between border-b border-slate-100 last:border-b-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center space-x-2">
                            <Pill className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="font-bold">{med.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-slate-400 font-mono">RxCUI: {med.rxcui}</span>
                            {alreadyAdded ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 font-bold">Added</span>
                            ) : (
                              <Plus className="w-4 h-4 text-teal-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Active Medication Chips/Cards */}
            <div className="mt-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Active Regimen List ({activeMeds.length})
                </span>
                {activeMeds.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-xs text-rose-600 hover:text-rose-700 transition-colors font-bold cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {activeMeds.length === 0 ? (
                /* Thoughtful Empty State */
                <div className="py-12 px-4 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center text-teal-600 p-3.5 mb-4 shadow-inner">
                    <Pill className="w-full h-full animate-pulse" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No medications added yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                    Search above and click to add prescription pills, insulin, heart medications, or supplements to your active list.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {activeMeds.map((med) => (
                      <motion.div
                        key={med.rxcui}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white border border-slate-200 hover:border-teal-500 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                            <Pill className="w-4.5 h-4.5" />
                          </div>
                          <div className="truncate">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{med.name}</h4>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">RxCUI: {med.rxcui}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMed(med.rxcui)}
                          className="p-1.5 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Remove from list"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Analyze Trigger */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={activeMeds.length === 0}
                className="w-full sm:w-auto px-6 py-4 bg-teal-600 text-white disabled:opacity-40 disabled:cursor-not-allowed font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-teal-600/30 cursor-pointer transition-all hover:bg-teal-700"
              >
                <span>Analyze Regimen Safety</span>
                <ArrowRight className="w-4 h-4 text-teal-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Predefined demo presets for testing */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-teal-600 uppercase tracking-widest block mb-2">
              Instant Demo Presets
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              To evaluate the clinical interaction checker, click a realistic caregiver scenario preset below to pre-populate the medication list instantly:
            </p>

            <div className="space-y-4">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset.drugs)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 hover:border-teal-500 rounded-2xl text-left hover:bg-white hover:shadow-md transition-all group flex flex-col items-start cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {preset.title}
                    </span>
                    <span className="text-[10px] font-bold text-teal-600 flex items-center space-x-1 uppercase tracking-wider">
                      <Play className="w-2.5 h-2.5 fill-teal-600" /> <span>Apply</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                    {preset.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {preset.drugs.map((d, dIdx) => (
                      <span 
                        key={dIdx} 
                        className="px-2 py-0.5 rounded-full text-[9px] bg-teal-50 text-teal-700 border border-teal-100 font-semibold"
                      >
                        {d.name}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center space-x-2">
              <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span>How we analyze</span>
            </h4>
            <div className="text-[11px] text-slate-500 space-y-3 leading-relaxed pl-1">
              <p>
                <strong className="text-slate-700">Step 1: NIH Database Check</strong>
                <br />
                We resolve exact drug ingredients and match clinical pairwise rules directly in the National Library of Medicine.
              </p>
              <p>
                <strong className="text-slate-700">Step 2: Gemini Synthesis</strong>
                <br />
                The AI analyzes clinical interactions and medication counts, identifying cumulative drug toxicity side effects.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
