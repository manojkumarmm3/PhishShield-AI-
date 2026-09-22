import React from 'react';
import { History, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onReset: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHistory, onReset, historyCount }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Custom SVG Brand Mark & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onReset} title="PhishShield AI Home">
          {/* Custom SVG Shield Circuit Logo matching the user visual specification */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-cyan-950/80 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <svg
              className="w-6 h-6 text-cyan-400"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Shield Outline */}
              <path
                d="M50 8 L84 22 C84 56 68 82 50 92 C32 82 16 56 16 22 Z"
                stroke="url(#shieldGrad)"
                strokeWidth="5"
                strokeLinejoin="round"
                fill="#0B0F17"
                fillOpacity="0.4"
              />

              {/* Inner stylized P circuit mark */}
              <path
                d="M40 76 V32 H60 C69 32 74 38 74 46 C74 54 69 60 60 60 H40"
                stroke="url(#shieldGrad)"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Circuit traces and nodes */}
              <path
                d="M28 34 H36 M28 50 H36 M64 74 L54 74 M54 74 V66"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Glowing Node dots */}
              <circle cx="28" cy="34" r="2.5" fill="#38bdf8" />
              <circle cx="28" cy="50" r="2.5" fill="#38bdf8" />
              <circle cx="64" cy="74" r="2.5" fill="#38bdf8" />
              <circle cx="50" cy="20" r="2.5" fill="#22d3ee" />
            </svg>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-white flex items-center">
              PhishShield
            </span>
            <span className="bg-cyan-500/10 text-cyan-400 text-xs px-2 py-0.5 rounded-full font-mono font-medium border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
              AI
            </span>
          </div>

          <span className="hidden md:inline-block text-xs text-slate-400 pl-2 border-l border-slate-800">
            Advanced Offer Letter & Phishing Inspector
          </span>
        </div>

        {/* Right: Status Indicator & Quick Tools */}
        <div className="flex items-center space-x-3">
          {/* Live system status pill */}
          <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-medium text-slate-300">
              Gemini 1.5 Active
            </span>
          </div>

          {/* Recent Scans / History Button */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors"
            title="View Scan History"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-cyan-500/20 text-cyan-400 rounded-full font-mono text-[10px]">
                {historyCount}
              </span>
            )}
          </button>

          {/* Reset / New Inspection */}
          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800/60 transition-colors"
            title="Start New Inspection"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Scan</span>
          </button>
        </div>

      </div>
    </header>
  );
};
