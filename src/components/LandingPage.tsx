import { motion } from "motion/react";
import { ShieldAlert, Pill, Sparkles, CheckCircle2, HeartPulse, UserCheck, Search } from "lucide-react";
import { ActivePage } from "../types";

interface LandingPageProps {
  onNavigate: (page: ActivePage) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const steps = [
    {
      icon: Search,
      title: "1. List Medications",
      description: "Caregivers easily enter multiple prescriptions with dynamic search and instant autocomplete suggestions."
    },
    {
      icon: ShieldAlert,
      title: "2. Check NLM Database",
      description: "Our system instantly cross-references the National Library of Medicine (RxNav) for known clinical pairwise interactions."
    },
    {
      icon: Sparkles,
      title: "3. Gemini AI Analysis",
      description: "Gemini synthesizes a personalized caregiver-friendly risk report, overall severity score, and 3 specific pharmacist questions."
    }
  ];

  return (
    <div className="bg-[#F8FAF9] min-h-screen text-slate-800 flex flex-col selection:bg-teal-500/10 selection:text-teal-900">
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-4 overflow-hidden border-b border-slate-200 bg-white">
        {/* Abstract background subtle gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Tagline */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-teal-50 border border-teal-100 px-3.5 py-1.5 rounded-full mb-8"
          >
            <ShieldAlert className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-teal-700 tracking-wider">
              CLINICAL-GRADE SAFETY ASSISTANT
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-6"
          >
            Protect Your Loved Ones From{" "}
            <span className="bg-gradient-to-r from-teal-600 via-teal-700 to-indigo-700 bg-clip-text text-transparent">
              Dangerous Drug Interactions
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            When managing multiple prescriptions from different doctors, dangerous interactions can go unnoticed. MedGuard cross-checks the National Library of Medicine and synthesizes immediate, plain-language risk alerts powered by Gemini.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => onNavigate("auth")}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-600/30 hover:bg-teal-700 transform hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Start Free Analysis
            </button>
            <a
              href="#problem"
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-center"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </section>

      {/* Problem & Caregiver Context Section */}
      <section id="problem" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block mb-2">
              THE CAREGIVER CHALLENGE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
              When 4+ Prescriptions Come From 3 Different Doctors
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Elderly patients or family members receiving treatment for multiple chronic conditions are often prescribed drugs by separate specialists. No single doctor has the full picture, leaving caregivers with the silent burden of tracking interactions.
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-1 flex items-center justify-center w-5 h-5 rounded bg-rose-50 border border-rose-200 text-rose-600 font-bold shrink-0">
                  !
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Overlooked Cumulative Side Effects</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Pairwise checks miss compound risk. Adding a 3rd or 4th drug can amplify blood thinning, blood pressure drop, or sedation dangerously.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-1 flex items-center justify-center w-5 h-5 rounded bg-rose-50 border border-rose-200 text-rose-600 font-bold shrink-0">
                  !
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Confusing Clinical Jargon</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Standard drug leaflets use dense, clinical terms. Caregivers need direct, clear warnings and actionable questions to ask doctors.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual card mimicking a summary alert */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 to-indigo-500/10 rounded-3xl filter blur-xl pointer-events-none" />
            <div className="relative bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Pill className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-bold text-slate-800">Regimen Risk Check</span>
                </div>
                <span className="px-3 py-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-full flex items-center space-x-1">
                  <span className="text-amber-500">●</span> <span>Moderate Risk</span>
                </span>
              </div>

              {/* Sample list */}
              <div className="mb-6 space-y-2">
                <div className="text-xs font-bold text-slate-400 tracking-wider">ACTIVE MEDS:</div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold">Warfarin</span>
                  <span className="px-3 py-1.5 rounded-full text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold">Aspirin</span>
                  <span className="px-3 py-1.5 rounded-full text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold">Ibuprofen</span>
                </div>
              </div>

              {/* Gemini block simulation */}
              <div className="bg-[#FAF9FF] border border-violet-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center space-x-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span className="text-xs font-bold tracking-wider text-violet-700 uppercase">Gemini AI Synthesis</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  "While each pair is moderately flagged individually, taking <strong className="text-slate-900">Warfarin, Aspirin, and Ibuprofen</strong> concurrently severely increases cumulative bleeding risk. Strongly recommend scheduling an urgent pharmacotherapy review with your primary care provider."
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Data Source: NLM RxNav</span>
                  <span className="text-violet-600 font-bold">Verified Clinical Prompt</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="bg-white py-24 px-4 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block mb-2">
              THREE STEP PROTECTION
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Simple, Safe, and Instant Workflow
            </h2>
            <p className="text-slate-500 text-sm mt-3 leading-relaxed">
              We process everything on secure servers, translating complex medical definitions into caregiver clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="bg-[#F8FAF9] border border-slate-200 rounded-2xl p-6 sm:p-8 hover:border-teal-500 hover:shadow-lg transition-all flex flex-col items-start">
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mb-6">
                  <step.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={() => onNavigate("auth")}
              className="px-8 py-4 bg-teal-600 text-white hover:bg-teal-700 font-bold rounded-xl shadow-lg shadow-teal-600/30 transition-all cursor-pointer inline-flex items-center space-x-2"
            >
              <span>Verify My Family's Meds Now</span>
              <HeartPulse className="w-5 h-5 text-teal-200" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-16 px-4 border-t border-slate-200 bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600/20 flex items-center justify-center text-teal-400">
              <Pill className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-sm">MedGuard Caregiver Portal</span>
          </div>
          <p className="max-w-md md:text-right leading-relaxed text-xs text-slate-400">
            Disclaimer: MedGuard is a decision-support demonstration tool using the NIH NLM REST APIs and Gemini AI. It does not provide medical advice. Always consult a certified pharmacist or licensed physician before initiating, modifying, or terminating any drug therapies.
          </p>
        </div>
        <p className="mt-12 text-center text-[11px] font-mono text-slate-600 border-t border-slate-800 pt-8">
          © {new Date().getFullYear()} MedGuard. Powered by Gemini & NLM RxNav APIs.
        </p>
      </footer>
    </div>
  );
}
