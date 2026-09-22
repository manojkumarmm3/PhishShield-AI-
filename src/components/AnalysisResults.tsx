import React, { useState } from 'react';
import { InspectionResult } from '../types';
import { ThreatGauge } from './ThreatGauge';
import { getRiskBadgeClasses } from '../utils/heuristics';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  ExternalLink,
  Info,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface AnalysisResultsProps {
  result: InspectionResult;
  onReset: () => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, onReset }) => {
  const [copied, setCopied] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopyReport = () => {
    const reportText = `[PHISHSHIELD AI - FORENSIC REPORT]
Threat Index: ${result.scamThreatIndex}/100 (${result.riskLevel} RISK)
Date: ${result.timestamp}
Input Type: ${result.inputType.toUpperCase()}

EXECUTIVE SUMMARY:
${result.reasoningSummary}

DETECTED RED FLAGS:
${result.detectedRedFlags.map((rf, i) => `${i + 1}. [${rf.severity}] ${rf.category}: ${rf.flag}`).join('\n')}

FLAGGED KEYWORDS:
${result.highlightedKeywords.map(kw => `• ${kw.word} (${kw.riskType})`).join('\n')}

RECOMMENDED ACTIONS:
${result.recommendedActions.map((act, i) => `[ ] ${act}`).join('\n')}
`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const reportData = JSON.stringify(result, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phishshield-incident-${result.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Verdict & Actions */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {result.notice && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs flex items-center space-x-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>{result.notice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left / Gauge */}
          <div className="lg:col-span-4 flex justify-center">
            <ThreatGauge score={result.scamThreatIndex} riskLevel={result.riskLevel} />
          </div>

          {/* Right / Executive Summary */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Forensic Security Assessment
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-cyan-400 border border-slate-700">
                  ID: {result.id.slice(0, 8)}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyReport}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  title="Copy Full Report to Clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Report</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadReport}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  title="Export Incident JSON"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export JSON</span>
                </button>

                <button
                  onClick={onReset}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 hover:bg-cyan-900/60 transition-colors"
                  title="Scan Another Document"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Scan Another</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                <span>Executive Verdict:</span>
                <span className={`px-2.5 py-0.5 rounded text-sm font-mono ${getRiskBadgeClasses(result.riskLevel)}`}>
                  {result.riskLevel} PHISHING PROBABILITY
                </span>
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed bg-[#070A10]/70 p-4 rounded-xl border border-slate-800 font-sans">
                {result.reasoningSummary}
              </p>
            </div>

            {/* AI Core metadata badge */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400 font-mono">
              <span className="flex items-center space-x-1 text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Engine: Gemini 1.5 Flash Multimodal</span>
              </span>
              <span>•</span>
              <span>Target: {result.inputType.toUpperCase()}</span>
              {result.fileName && (
                <>
                  <span>•</span>
                  <span className="text-slate-300 truncate max-w-xs">File: {result.fileName}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Red Flags vs Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Detected Red Flags */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-800/40">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Forensic Threat Flags ({result.detectedRedFlags.length})
              </span>
            </div>
            <span className="text-xs text-slate-400">Ranked by severity</span>
          </div>

          <div className="space-y-3">
            {result.detectedRedFlags.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm">No critical scam indicators were detected in this document.</p>
              </div>
            ) : (
              result.detectedRedFlags.map((flag, idx) => {
                const isHigh = flag.severity === 'HIGH';
                const isMed = flag.severity === 'MEDIUM';

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isHigh
                        ? 'bg-rose-950/20 border-rose-800/40'
                        : isMed
                        ? 'bg-amber-950/20 border-amber-800/40'
                        : 'bg-slate-950/40 border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-200">
                        {flag.category}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          isHigh
                            ? 'bg-rose-900/50 text-rose-300 border border-rose-700/60'
                            : isMed
                            ? 'bg-amber-900/50 text-amber-300 border border-amber-700/60'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {flag.severity} SEVERITY
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {flag.flag}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Highlighted Semantic Keywords */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-800/40">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Risk Term Lexicon
              </span>
            </div>
            <span className="font-mono text-xs text-slate-400">
              {result.highlightedKeywords.length} terms
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-normal">
            Specific phrases identified by Gemini that correlate with social engineering vectors:
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {result.highlightedKeywords.length === 0 ? (
              <span className="text-xs text-slate-400">No anomalous risk keywords isolated.</span>
            ) : (
              result.highlightedKeywords.map((kw, i) => {
                let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
                if (kw.riskType === 'PAYMENT') {
                  badgeClass = 'bg-rose-950/40 text-rose-300 border-rose-800/60';
                } else if (kw.riskType === 'DOMAIN') {
                  badgeClass = 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60';
                } else if (kw.riskType === 'URGENCY') {
                  badgeClass = 'bg-amber-950/40 text-amber-300 border-amber-800/60';
                }

                return (
                  <div
                    key={i}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${badgeClass}`}
                  >
                    <span>{kw.word}</span>
                    <span className="text-[9px] uppercase opacity-70">[{kw.riskType}]</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/30 border border-rose-500/50"></span>
              <span>PAYMENT: Unauthorized vendor wire, fake checks</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/30 border border-cyan-500/50"></span>
              <span>DOMAIN: Free webmail, typosquats, spoofed relays</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30 border border-amber-500/50"></span>
              <span>URGENCY: Psychological haste, artificial deadlines</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recommended Countermeasures & Verification Checklist */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Recommended Protective Countermeasures Checklist
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {Object.values(completedSteps).filter(Boolean).length} / {result.recommendedActions.length} Completed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.recommendedActions.map((action, idx) => {
            const isDone = !!completedSteps[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`p-3.5 rounded-xl border cursor-pointer select-none flex items-start space-x-3 transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-800/50 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-400 text-black'
                      : 'border-slate-600 bg-slate-900'
                  }`}
                >
                  {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className={`text-xs leading-relaxed ${isDone ? 'line-through text-slate-400' : ''}`}>
                  {action}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
