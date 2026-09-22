import React from 'react';
import { InspectionResult } from '../types';
import { getRiskBadgeClasses, getScoreColorClass } from '../utils/heuristics';
import { X, Trash2, ExternalLink, ShieldAlert, History } from 'lucide-react';

interface RecentScansModalProps {
  isOpen: boolean;
  onClose: () => void;
  scans: InspectionResult[];
  onSelectScan: (scan: InspectionResult) => void;
  onClearHistory: () => void;
}

export const RecentScansModal: React.FC<RecentScansModalProps> = ({
  isOpen,
  onClose,
  scans,
  onSelectScan,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0D121D] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Inspection History</h3>
              <p className="text-xs text-slate-400">Local audit log of previously evaluated offer letters and artifacts</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {scans.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded border border-rose-900/40 transition-colors"
                title="Clear all saved scans"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {scans.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm">No recent scans recorded in this session.</p>
              <p className="text-xs text-slate-500">Run an offer letter inspection to populate your local audit trail.</p>
            </div>
          ) : (
            scans.map((scan) => (
              <div
                key={scan.id}
                onClick={() => {
                  onSelectScan(scan);
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="text-center w-12 flex-shrink-0">
                    <span className={`font-mono text-base font-bold ${getScoreColorClass(scan.scamThreatIndex)}`}>
                      {scan.scamThreatIndex}
                    </span>
                    <span className="text-[10px] text-slate-500 block -mt-1 font-mono">/ 100</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-mono px-2 py-0.2 rounded font-semibold ${getRiskBadgeClasses(scan.riskLevel)}`}>
                        {scan.riskLevel}
                      </span>
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        {scan.inputType}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-1 max-w-md">
                      {scan.reasoningSummary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <span>View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-center text-xs text-slate-500">
          All scan results are maintained locally on your device in secure sandbox storage.
        </div>
      </div>
    </div>
  );
};
