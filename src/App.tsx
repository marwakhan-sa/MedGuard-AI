import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  auth, 
  onAuthStateChanged, 
  db, 
  collection, 
  addDoc, 
  User as FirebaseUser 
} from "./lib/firebase";
import { ActivePage, Medication, PairwiseInteraction, AiRiskSummary, AnalysisResult } from "./types";

import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import DashboardPage from "./components/DashboardPage";
import ResultsPage from "./components/ResultsPage";
import HistoryPage from "./components/HistoryPage";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>("landing");

  // Local state for active medications
  const [savedMeds, setSavedMeds] = useState<Medication[]>([]);

  // States for active analysis results
  const [selectedMedications, setSelectedMedications] = useState<Medication[]>([]);
  const [selectedInteractions, setSelectedInteractions] = useState<PairwiseInteraction[]>([]);
  const [selectedAiSummary, setSelectedAiSummary] = useState<AiRiskSummary | null>(null);
  const [analysisSaved, setAnalysisSaved] = useState(false);

  // Load local active medications from localStorage on mount
  useEffect(() => {
    try {
      const local = localStorage.getItem("medguard_active_meds");
      if (local) {
        setSavedMeds(JSON.parse(local));
      }
    } catch (e) {
      console.error("Failed to load local active meds from localStorage:", e);
    }
  }, []);

  // Monitor Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthInitialized(true);

      // If user is logged in and is on landing or login page, redirect to dashboard
      if (firebaseUser) {
        if (activePage === "landing" || activePage === "auth") {
          setActivePage("dashboard");
        }
      } else {
        // If logged out, only allow landing or auth
        if (activePage !== "landing" && activePage !== "auth") {
          setActivePage("landing");
        }
      }
    });

    return () => unsubscribe();
  }, [activePage]);

  // Handler to persist medications locally
  const handleSaveMedsLocally = (meds: Medication[]) => {
    setSavedMeds(meds);
    try {
      localStorage.setItem("medguard_active_meds", JSON.stringify(meds));
    } catch (e) {
      console.error("Failed to persist meds list:", e);
    }
  };

  // Handler for starting a fresh analysis
  const handleStartAnalysis = async (
    meds: Medication[], 
    interactions: PairwiseInteraction[], 
    aiSummary: AiRiskSummary
  ) => {
    setSelectedMedications(meds);
    setSelectedInteractions(interactions);
    setSelectedAiSummary(aiSummary);
    setAnalysisSaved(false);

    setActivePage("results");

    // Automatically persist this analysis to user's Firestore history if logged in
    if (user) {
      try {
        const docPayload = {
          userId: user.uid,
          createdAt: new Date().toISOString(), // Standard date string
          medications: meds,
          interactions: interactions,
          aiSummary: aiSummary
        };
        await addDoc(collection(db, "analyses"), docPayload);
        setAnalysisSaved(true);
      } catch (err) {
        console.error("Failed to automatically save analysis to Firestore history:", err);
      }
    }
  };

  // Handler when user selects a past analysis from the History tab
  const handleSelectPastAnalysis = (result: AnalysisResult) => {
    setSelectedMedications(result.medications);
    setSelectedInteractions(result.interactions);
    setSelectedAiSummary(result.aiSummary);
    setAnalysisSaved(true); // Since it came from Firestore, it is already saved
    setActivePage("results");
  };

  // Handler to coordinate smooth routing
  const handleNavigate = (page: ActivePage) => {
    if (!auth.currentUser && (page === "dashboard" || page === "results" || page === "history")) {
      setActivePage("auth");
    } else {
      setActivePage(page);
    }
  };

  if (!authInitialized) {
    return (
      <div className="bg-[#F8FAF9] min-h-screen flex items-center justify-center text-slate-800 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Initializing MedGuard clinical environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAF9] min-h-screen text-slate-800 flex flex-col font-sans antialiased selection:bg-teal-500/10 selection:text-teal-900 select-none md:select-text">
      <Navbar 
        user={user} 
        activePage={activePage} 
        onNavigate={handleNavigate} 
      />

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {activePage === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <LandingPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {activePage === "auth" && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <AuthPage 
                onSuccess={() => setActivePage("dashboard")} 
                onNavigate={handleNavigate} 
              />
            </motion.div>
          )}

          {activePage === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <DashboardPage 
                onStartAnalysis={handleStartAnalysis}
                savedMedications={savedMeds}
                onSaveMedsLocally={handleSaveMedsLocally}
              />
            </motion.div>
          )}

          {activePage === "results" && selectedAiSummary && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <ResultsPage 
                medications={selectedMedications}
                interactions={selectedInteractions}
                aiSummary={selectedAiSummary}
                isSaved={analysisSaved}
                onBack={() => handleNavigate("dashboard")}
              />
            </motion.div>
          )}

          {activePage === "history" && user && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <HistoryPage 
                user={user}
                onSelectPastAnalysis={handleSelectPastAnalysis}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
