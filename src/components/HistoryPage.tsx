import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import { 
  db, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  deleteDoc,
  User as FirebaseUser
} from "../lib/firebase";
import { AnalysisResult } from "../types";

// User-specific global in-memory cache to make page transitions completely instant
const globalHistoryCache = new Map<string, AnalysisResult[]>();

interface HistoryPageProps {
  user: FirebaseUser;
  onSelectPastAnalysis: (result: AnalysisResult) => void;
}

export default function HistoryPage({ user, onSelectPastAnalysis }: HistoryPageProps) {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>(() => {
    return globalHistoryCache.get(user.uid) || [];
  });
  const [loading, setLoading] = useState(() => {
    return !globalHistoryCache.has(user.uid);
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    try {
      const q = query(
        collection(db, "analyses"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const list: AnalysisResult[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          userId: data.userId,
          createdAt: data.createdAt,
          medications: data.medications || [],
          interactions: data.interactions || [],
          aiSummary: data.aiSummary || null
        });
      });
      setAnalyses(list);
      globalHistoryCache.set(user.uid, list);
    } catch (err) {
      console.error("Failed to fetch past analyses from Firestore:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If we don't have any cached data yet, show the full screen loading spinner
    const hasCache = globalHistoryCache.has(user.uid);
    fetchHistory(!hasCache);
  }, [user.uid]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding card
    if (!window.confirm("Are you sure you want to delete this interaction check from your history?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "analyses", id));
      const updatedList = analyses.filter(a => a.id !== id);
      setAnalyses(updatedList);
      globalHistoryCache.set(user.uid, updatedList);
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error("Failed to delete analysis record:", err);
      alert("Failed to delete record. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    
    // Firestore Timestamp or standard Date string/number
    try {
      let date: Date;
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "Unknown Date";
    }
  };

  const getSeverityStyle = (sev: "Low" | "Moderate" | "High") => {
    switch (sev) {
      case "High":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-700",
          icon: ShieldAlert,
          label: "High"
        };
      case "Moderate":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-700",
          icon: AlertTriangle,
          label: "Moderate"
        };
      case "Low":
      default:
        return {
          bg: "bg-teal-50 border-teal-200 text-teal-700",
          icon: CheckCircle,
          label: "Low"
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-[calc(100vh-68px)]">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Regimen Analysis History</h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse and manage previous medication risk analysis and caregiver briefs saved to your secure account.
          </p>
        </div>
        <span className="px-3.5 py-1.5 bg-teal-50 border border-teal-100 text-teal-700 font-bold text-xs rounded-full shadow-sm">
          {analyses.length} Saved Checks
        </span>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-4" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Retrieving history records...</p>
        </div>
      ) : analyses.length === 0 ? (
        /* Empty State */
        <div className="py-20 px-6 border-2 border-dashed border-slate-200 bg-slate-50 rounded-3xl text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Clock className="w-6 h-6 text-teal-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No past analyses recorded</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 leading-relaxed font-medium">
            Perform your first clinical medication interaction safety scan. Once scanned, your caregiver briefs will save automatically here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {analyses.map((item) => {
            const isExpanded = expandedId === item.id;
            const sevStyle = getSeverityStyle(item.aiSummary?.severity || "Low");
            const SeverityIcon = sevStyle.icon;

            return (
              <div 
                key={item.id}
                className={`bg-white border rounded-3xl overflow-hidden transition-all duration-300 ${
                  isExpanded ? "border-teal-500/30 ring-2 ring-teal-500/5 shadow-xl" : "border-slate-200 hover:border-slate-350 hover:shadow-md"
                }`}
              >
                {/* Summary Row */}
                <div 
                  onClick={() => toggleExpand(item.id!)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex-1 space-y-2">
                    {/* Timestamp & medications count */}
                    <div className="flex items-center space-x-2.5 text-xs text-slate-400 font-bold uppercase tracking-widest">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <span>{item.medications.length} Drugs</span>
                    </div>

                    {/* Medications list */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.medications.map((m, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-1 rounded-lg text-[10px] bg-slate-50 border border-slate-100 text-slate-700 font-bold"
                        >
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right hand controls (Severity + Chevron + Delete) */}
                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center space-x-1 uppercase ${sevStyle.bg}`}>
                      <SeverityIcon className="w-3 h-3 shrink-0" />
                      <span>{sevStyle.label} Risk</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => handleDelete(item.id!, e)}
                        disabled={deletingId === item.id}
                        title="Delete past scan"
                        className="p-1.5 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="p-1.5 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 shrink-0">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Details Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/40 overflow-hidden"
                    >
                      <div className="p-4 sm:p-6 space-y-5">
                        
                        {/* Gemini Summary section */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative shadow-sm">
                          <div className="absolute top-4 right-4 w-6 h-6 bg-violet-50 text-violet-600 border border-violet-100 rounded-full flex items-center justify-center p-1 pointer-events-none shadow-sm">
                            <Sparkles className="w-full h-full" />
                          </div>
                          
                          <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest block mb-1">
                            Synthesized AI Risk Summary
                          </span>
                          <h4 className="text-xs font-extrabold text-slate-800 italic mb-3">
                            "{item.aiSummary?.severityJustification}"
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                            {item.aiSummary?.summary}
                          </p>
                        </div>

                        {/* Questions bullet review */}
                        {item.aiSummary?.questions && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                              Suggested Provider Questions Checklist
                            </span>
                            <div className="grid grid-cols-1 gap-2">
                              {item.aiSummary.questions.map((q, qIdx) => (
                                <div 
                                  key={qIdx} 
                                  className="p-3 bg-white border border-slate-150 rounded-xl text-xs text-slate-700 flex items-start space-x-2.5 font-semibold"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0"></span>
                                  <span className="leading-relaxed">{q}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action link */}
                        <div className="flex justify-end pt-3 border-t border-slate-100">
                          <button
                            onClick={() => onSelectPastAnalysis(item)}
                            className="inline-flex items-center space-x-1.5 text-xs text-teal-600 hover:text-teal-700 font-bold cursor-pointer"
                          >
                            <span>Open Full Analysis Screen</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
