import React from 'react';
import { RiskLevel } from '../types';
import { getRiskBadgeClasses, getRiskColorHex } from '../utils/heuristics';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface ThreatGaugeProps {
  score: number;
  riskLevel: RiskLevel;
}

export const ThreatGauge: React.FC<ThreatGaugeProps> = ({ score, riskLevel }) => {
  // SVG Arc calculation for semi-circle gauge (radius 60, circumference = pi * 60 = 188.5)
  const radius = 64;
  const strokeWidth = 10;
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const arcLength = Math.PI * radius; // 201.06
  const strokeDashoffset = arcLength - (arcLength * normalizedScore) / 100;
  const colorHex = getRiskColorHex(riskLevel);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl relative overflow-hidden shadow-lg">
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
        {score >= 60 ? (
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span>Scam Threat Index</span>
      </div>

      <div className="relative w-48 h-28 flex items-end justify-center">
        <svg className="w-48 h-28 overflow-visible" viewBox="0 0 160 90">
          <defs>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background Arc */}
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Colored Arc */}
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            fill="none"
            stroke={colorHex}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Numerical Metric */}
        <div className="absolute bottom-1 text-center flex flex-col items-center">
          <span className="font-mono text-4xl font-extrabold tracking-tight" style={{ color: colorHex }}>
            {normalizedScore}
          </span>
          <span className="text-[10px] font-mono text-slate-400 -mt-1">/ 100</span>
        </div>
      </div>

      {/* Status Indicator Badge */}
      <div className="mt-3">
        <span className={`text-xs px-3 py-1 rounded-full font-mono font-semibold tracking-wider ${getRiskBadgeClasses(riskLevel)}`}>
          {riskLevel} RISK VERDICT
        </span>
      </div>

      <p className="text-xs text-slate-400 text-center mt-2.5 max-w-xs leading-normal">
        {riskLevel === 'CRITICAL' && 'Immediate scam vector detected. High likelihood of advance-fee fraud.'}
        {riskLevel === 'HIGH' && 'Severe red flags identified. Do not sign or wire funds.'}
        {riskLevel === 'MEDIUM' && 'Caution advised. Irregularities found requiring independent verification.'}
        {riskLevel === 'LOW' && 'Baseline standard phrasing. Always verify through official channels.'}
      </p>
    </div>
  );
};
