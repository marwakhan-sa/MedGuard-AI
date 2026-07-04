import { useState } from "react";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  CheckSquare, 
  Pill, 
  Plus, 
  BookmarkCheck,
  RotateCcw
} from "lucide-react";
import { Medication, PairwiseInteraction, AiRiskSummary } from "../types";

interface ResultsPageProps {
  medications: Medication[];
  interactions: PairwiseInteraction[];
  aiSummary: AiRiskSummary;
  onBack: () => void;
  isSaved: boolean; // Indicates if the result has been stored in Firestore
}

export default function ResultsPage({ 
  medications, 
  interactions, 
  aiSummary, 
  onBack,
  isSaved
}: ResultsPageProps) {
  const [questionsChecked, setQuestionsChecked] = useState<boolean[]>([false, false, false]);

  const toggleQuestion = (idx: number) => {
    const updated = [...questionsChecked];
    updated[idx] = !updated[idx];
    setQuestionsChecked(updated);
  };

  // Helper to resolve severity badge styling with strong high contrast
  const getSeverityBadge = (sev: "Low" | "Moderate" | "High") => {
    switch (sev) {
      case "High":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-700",
          icon: ShieldAlert,
          label: "High Risk Regimen"
        };
      case "Moderate":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-700",
          icon: AlertTriangle,
          label: "Moderate Risk Regimen"
        };
      case "Low":
      default:
        return {
          bg: "bg-teal-50 border-teal-200 text-teal-700",
          icon: CheckCircle,
          label: "Low Risk Regimen"
        };
    }
  };

  const getInteractionSeverityColor = (sev: string) => {
    const s = sev.toLowerCase();
    if (s.includes("high") || s.includes("critical") || s.includes("severe")) {
      return {
        badgeBg: "bg-rose-50 text-rose-700 border-rose-100",
        border: "border-slate-200",
        text: "text-rose-700",
        icon: ShieldAlert
      };
    } else if (s.includes("low") || s.includes("minor")) {
      return {
        badgeBg: "bg-teal-50 text-teal-700 border-teal-100",
        border: "border-slate-200",
        text: "text-teal-700",
        icon: CheckCircle
      };
    } else {
      return {
        badgeBg: "bg-amber-50 text-amber-700 border-amber-100",
        border: "border-slate-200",
        text: "text-amber-700",
        icon: AlertTriangle
      };
    }
  };

  const severityBadge = getSeverityBadge(aiSummary.severity);
  const SeverityIcon = severityBadge.icon;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 relative">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition-all cursor-pointer font-mono uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Modify Drug List</span>
        </button>

        {isSaved && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-xl text-teal-700 text-xs font-bold shadow-sm">
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Successfully Saved to Analysis History</span>
          </div>
        )}
      </div>

      {/* Overview Card: List of current medications */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Currently Analyzing Regimen
          </span>
          <div className="flex flex-wrap gap-2 mt-3">
            {medications.map((m, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-800 shadow-inner"
              >
                <Pill className="w-3.5 h-3.5 text-teal-600" />
                <strong className="font-extrabold text-slate-900">{m.name}</strong>
                <span className="text-[10px] font-mono text-slate-400 font-medium">({m.rxcui})</span>
              </span>
            ))}
          </div>
        </div>

        <button 
          onClick={onBack}
          className="px-4 py-2.5 border border-slate-200 hover:border-teal-500 bg-white text-teal-600 hover:text-teal-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm hover:shadow"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Check</span>
        </button>
      </div>

      {/* Grid Layout for AI Summary vs Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CENTERPIECE COLUMN: AI Risk Summary (60% width on large screens) */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[32px] p-0.5 bg-gradient-to-br from-violet-200 via-teal-200 to-emerald-100 shadow-xl"
          >
            {/* Ambient decorative background glow inside the container */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-violet-500/5 rounded-full filter blur-2xl pointer-events-none" />
            
            <div className="bg-white rounded-[30px] p-6 sm:p-8">
              
              {/* AI Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Gemini Safety Synthesis</h3>
                    <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest block mt-0.5">
                      Clinical-Safety AI Report
                    </span>
                  </div>
                </div>

                {/* Overall Regimen Severity Rating Badge */}
                <span className={`px-3 py-1.5 text-xs font-extrabold border rounded-full flex items-center space-x-1.5 shadow-sm ${severityBadge.bg}`}>
                  <SeverityIcon className="w-4 h-4 shrink-0" />
                  <span>{severityBadge.label}</span>
                </span>
              </div>

              {/* Severity Justification Highlight */}
              <div className="bg-amber-50/50 border-l-4 border-amber-500 rounded-r-2xl p-4.5 mb-6 shadow-sm">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block mb-1">
                  regimen assessment:
                </span>
                <p className="text-sm font-extrabold text-slate-800 leading-relaxed">
                  {aiSummary.severityJustification}
                </p>
              </div>

              {/* Narrative Summary Body */}
              <div className="space-y-4 mb-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Caregiver Clinical Brief
                </h4>
                <div className="text-slate-600 text-sm leading-relaxed space-y-3 whitespace-pre-wrap font-medium">
                  {aiSummary.summary}
                </div>
              </div>

              {/* Specific Doctor Questions Checklist */}
              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <HelpCircle className="w-4 h-4 text-violet-600" />
                  <h4 className="text-xs font-bold text-violet-600 uppercase tracking-widest">
                    Questions For Your Next Medical Appointment
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  Take this list to your next pharmacist consultation or primary doctor visit. Tap to check off as you ask them:
                </p>

                <div className="space-y-3">
                  {aiSummary.questions.map((question, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => toggleQuestion(qIdx)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                        questionsChecked[qIdx] 
                          ? "bg-teal-50/40 border-teal-200 text-slate-400" 
                          : "bg-slate-50 border-slate-100 hover:border-violet-300 text-slate-800"
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
                        questionsChecked[qIdx] 
                          ? "bg-teal-600 border-teal-600 text-white" 
                          : "border-slate-300 bg-white"
                      }`}>
                        {questionsChecked[qIdx] && <CheckSquare className="w-3.5 h-3.5 font-extrabold text-white" />}
                      </div>
                      <span className={`text-xs md:text-sm font-bold leading-relaxed ${
                        questionsChecked[qIdx] ? "line-through text-slate-400 font-medium" : "text-slate-800"
                      }`}>
                        {question}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Disclaimer Footer */}
              <div className="mt-8 pt-5 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 leading-relaxed max-w-md mx-auto font-medium">
                  💡 <strong>Important Clinical Disclaimer:</strong> Always confirm this computerized synthesis with a licensed pharmacist or personal physician before changing any medication dosages, frequencies, or schedules.
                </p>
              </div>

            </div>
          </motion.div>
        </div>

        {/* SIDE COLUMN: Raw Pairwise Interaction Details (40% width on large screens) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">NIH Database Match Details</h3>
                <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                  Pairwise Interaction Matches ({interactions.length})
                </span>
              </div>
            </div>

            {interactions.length === 0 ? (
              /* Reassuring no interactions empty state */
              <div className="py-10 text-center border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl px-4">
                <div className="w-12 h-12 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center text-teal-600 mx-auto mb-4 shadow-inner animate-pulse">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-teal-700">No NIH Interaction Matches</h4>
                <p className="text-[11px] text-slate-500 max-w-[240px] mx-auto mt-1.5 leading-relaxed">
                  No pairwise clinical interaction reports were matched in the NIH database for this exact drug set.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {interactions.map((interaction, idx) => {
                  const style = getInteractionSeverityColor(interaction.severity);
                  const CardIcon = style.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-slate-50 border border-slate-150 rounded-2xl p-4 hover:bg-white hover:shadow-md transition-all"
                    >
                      {/* Pair Title */}
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2">
                        <div className="flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono text-slate-500 border border-slate-200">
                          <span>Pair #{idx + 1}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono border ${style.badgeBg} flex items-center space-x-1 uppercase`}>
                          <CardIcon className="w-2.5 h-2.5" />
                          <span>{interaction.severity}</span>
                        </span>
                      </div>

                      {/* Overlapping medications */}
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 my-2">
                        {interaction.drugs.map((drug, dIdx) => (
                          <div key={dIdx} className="flex items-center space-x-1">
                            <span className="text-xs font-extrabold text-slate-800 uppercase">{drug.name}</span>
                            {dIdx < interaction.drugs.length - 1 && <span className="text-teal-600 text-xs font-extrabold shrink-0">↔</span>}
                          </div>
                        ))}
                      </div>

                      {/* Clinical description */}
                      <p className="text-xs text-slate-600 leading-relaxed mt-2.5 border-t border-slate-200/60 pt-2.5 font-medium">
                        {interaction.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Dotted comparison callout: Add more for comparison */}
            <button
              onClick={onBack}
              className="w-full p-5 bg-slate-50 border-dashed border-2 border-slate-200 hover:border-teal-500 hover:bg-white rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-teal-600 gap-2 transition-all cursor-pointer group mt-4"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-teal-50 flex items-center justify-center text-slate-400 group-hover:text-teal-600 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-center">Add more for comparison</span>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
