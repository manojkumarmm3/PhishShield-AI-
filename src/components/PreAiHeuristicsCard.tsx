import React from 'react';
import { ClientHeuristicAnalysis, InputTabType } from '../types';
import { getRiskBadgeClasses, getScoreColorClass } from '../utils/heuristics';
import { AlertTriangle, DollarSign, Globe, Clock, ShieldCheck, MailCheck } from 'lucide-react';

interface PreAiHeuristicsCardProps {
  analysis: ClientHeuristicAnalysis;
  inputType: InputTabType;
  hasInput: boolean;
}

export const PreAiHeuristicsCard: React.FC<PreAiHeuristicsCardProps> = ({
  analysis,
  inputType,
  hasInput,
}) => {
  if (!hasInput) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-slate-800/60 text-slate-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Client-Side Real-Time Heuristic Engine
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live syntax & trigger analysis awaits input. Checks financial demand (+35%), contact domain (+20%), and urgency (+15%).
            </p>
          </div>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
          Standby
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/50 border border-cyan-800/50 text-cyan-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pre-AI Heuristic Telemetry
            </span>
            <span className="text-xs font-medium text-slate-300">
              Immediate client-side risk vector calculation
            </span>
          </div>
        </div>

        {/* Live score indicator */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Pre-Scan Index:</span>
          <span className={`font-mono text-base font-bold ${getScoreColorClass(analysis.score)}`}>
            {analysis.score}/100
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-medium ${getRiskBadgeClasses(analysis.riskLevel)}`}>
            {analysis.riskLevel}
          </span>
        </div>
      </div>

      {/* 3 Core Heuristic Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        {/* Pillar 1: Financial Risk (+35%) */}
        <div className={`p-3 rounded-lg border transition-all ${
          analysis.hasHighFinancialRisk 
            ? 'bg-rose-950/20 border-rose-800/40 text-rose-200' 
            : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <DollarSign className={`w-3.5 h-3.5 ${analysis.hasHighFinancialRisk ? 'text-rose-400' : 'text-slate-500'}`} />
              <span className="text-[11px] font-semibold tracking-wide">Advance-Fee / Payment</span>
            </div>
            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
              analysis.hasHighFinancialRisk 
                ? 'bg-rose-900/50 text-rose-300 border border-rose-700/60' 
                : 'bg-slate-800/60 text-slate-400'
            }`}>
              {analysis.hasHighFinancialRisk ? '+35% Threat' : '0%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analysis.hasHighFinancialRisk
              ? `Detected: ${analysis.triggers.payment.slice(0, 3).join(', ')}${analysis.triggers.payment.length > 3 ? '...' : ''}`
              : 'No payment/wire equipment triggers'}
          </p>
        </div>

        {/* Pillar 2: Domain Risk (+20%) */}
        <div className={`p-3 rounded-lg border transition-all ${
          analysis.hasSuspiciousDomain 
            ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' 
            : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Globe className={`w-3.5 h-3.5 ${analysis.hasSuspiciousDomain ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="text-[11px] font-semibold tracking-wide">Domain / Channel</span>
            </div>
            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
              analysis.hasSuspiciousDomain 
                ? 'bg-amber-900/50 text-amber-300 border border-amber-700/60' 
                : 'bg-slate-800/60 text-slate-400'
            }`}>
              {analysis.hasSuspiciousDomain ? '+20% Threat' : '0%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analysis.hasSuspiciousDomain
              ? `Unverified: ${analysis.triggers.domain.slice(0, 2).join(', ')}`
              : analysis.detectedDomains.length > 0
              ? `Domains: ${analysis.detectedDomains.slice(0, 2).join(', ')}`
              : 'Standard channel pattern'}
          </p>
        </div>

        {/* Pillar 3: Urgency (+15%) */}
        <div className={`p-3 rounded-lg border transition-all ${
          analysis.hasTacticalUrgency 
            ? 'bg-orange-950/20 border-orange-800/40 text-orange-200' 
            : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Clock className={`w-3.5 h-3.5 ${analysis.hasTacticalUrgency ? 'text-orange-400' : 'text-slate-500'}`} />
              <span className="text-[11px] font-semibold tracking-wide">Tactical Urgency</span>
            </div>
            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
              analysis.hasTacticalUrgency 
                ? 'bg-orange-900/50 text-orange-300 border border-orange-700/60' 
                : 'bg-slate-800/60 text-slate-400'
            }`}>
              {analysis.hasTacticalUrgency ? '+15% Threat' : '0%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analysis.hasTacticalUrgency
              ? `Coercion: ${analysis.triggers.urgency.slice(0, 2).join(', ')}`
              : 'No artificial urgency phrasing'}
          </p>
        </div>
      </div>

      {/* Special Email Header Meta Bar if in Header mode */}
      {inputType === 'header' && analysis.emailHeaderMeta && (
        <div className="mt-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center space-x-1 text-slate-300">
            <MailCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>RFC 822 Check:</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">SPF:</span>
            <span className={analysis.emailHeaderMeta.spfStatus?.includes('Pass') ? 'text-emerald-400' : 'text-rose-400'}>
              {analysis.emailHeaderMeta.spfStatus || 'None'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">DKIM:</span>
            <span className={analysis.emailHeaderMeta.dkimStatus?.includes('Pass') ? 'text-emerald-400' : 'text-rose-400'}>
              {analysis.emailHeaderMeta.dkimStatus || 'None'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">DMARC:</span>
            <span className={analysis.emailHeaderMeta.dmarcStatus?.includes('Pass') ? 'text-emerald-400' : 'text-rose-400'}>
              {analysis.emailHeaderMeta.dmarcStatus || 'None'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
