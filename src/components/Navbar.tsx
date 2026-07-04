import { motion } from "motion/react";
import { Pill, ShieldAlert, LogOut, History, Activity, User } from "lucide-react";
import { User as FirebaseUser, signOut, auth } from "../lib/firebase";
import { ActivePage } from "../types";

interface NavbarProps {
  user: FirebaseUser | null;
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
}

export default function Navbar({ user, activePage, onNavigate }: NavbarProps) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onNavigate("landing");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <button 
          onClick={() => onNavigate(user ? "dashboard" : "landing")}
          className="flex items-center space-x-3 focus:outline-none group cursor-pointer"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 p-2 shadow-lg shadow-teal-600/20 group-hover:scale-105 transition-transform">
            <Pill className="w-5 h-5 text-white" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal-900 rounded-full flex items-center justify-center border border-white">
              <ShieldAlert className="w-2.5 h-2.5 text-teal-200" />
            </div>
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-lg font-bold tracking-tight text-teal-900">
              MedGuard
            </span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-0.5">
              Caregiver Assistant
            </span>
          </div>
        </button>

        {/* Navigation Elements */}
        {user ? (
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={() => onNavigate("dashboard")}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                activePage === "dashboard" || activePage === "results"
                  ? "bg-teal-50 border border-teal-100 text-teal-700"
                  : "text-slate-500 hover:text-teal-600 hover:bg-slate-50"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Interaction Checker</span>
              <span className="sm:hidden">Checker</span>
            </button>

            <button
              onClick={() => onNavigate("history")}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                activePage === "history"
                  ? "bg-teal-50 border border-teal-100 text-teal-700"
                  : "text-slate-500 hover:text-teal-600 hover:bg-slate-50"
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Past Analyses</span>
              <span className="sm:hidden">History</span>
            </button>

            <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

            {/* User display & logout */}
            <div className="flex items-center space-x-2 pl-1">
              <div className="hidden md:flex flex-col items-end text-right leading-none">
                <span className="text-xs font-bold text-slate-900 max-w-[120px] truncate">
                  {user.displayName || user.email?.split("@")[0]}
                </span>
                <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mt-0.5">Caregiver</span>
              </div>
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-teal-700 overflow-hidden">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="avatar" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-4.5 h-4.5" />
                )}
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate("auth")}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-800 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate("auth")}
              className="px-4 py-2 text-xs sm:text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-600/20 transition-all cursor-pointer"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
